import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// La lectura de la imagen + llamada al modelo puede tardar; ampliamos el límite.
export const maxDuration = 60;

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

function extraerJson(texto: string): any {
  if (!texto) return null;
  // Quita posibles ```json ... ``` y busca el primer objeto { ... }
  const limpio = texto.replace(/```json/gi, "").replace(/```/g, "");
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini === -1 || fin === -1 || fin < ini) return null;
  try {
    return JSON.parse(limpio.slice(ini, fin + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El escaneo con IA no está configurado en el servidor (falta NVIDIA_API_KEY)." },
      { status: 503 }
    );
  }

  const { imageBase64 } = await req.json().catch(() => ({}));
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "Falta la imagen a escanear" }, { status: 400 });
  }
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  // Catálogo para que la IA use nombres exactos y la unidad correcta
  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, unidad: true, categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });
  const catalogo = productos
    .map((p) => `- ${p.nombre} [${p.unidad}]`)
    .join("\n");

  const model = process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct";

  const instruccion = `Eres un asistente que transcribe HOJAS DE REGISTRO de donaciones humanitarias, escritas a mano o impresas, a datos estructurados.

Lee la imagen y extrae CADA renglón de producto donado. Devuelve ÚNICAMENTE un JSON válido (sin texto adicional, sin explicaciones) con esta forma exacta:
{"items":[{"texto":"<lo que dice el renglón tal cual>","producto":"<nombre del catálogo o vacío>","cantidadUnidades":<número de envases/paquetes o 0>,"tamano":<tamaño de cada envase en la unidad del producto o 0>,"unidad":"KG|LITROS|UNIDADES","cantidadTotal":<total ya calculado en la unidad del producto>}]}

Reglas:
- Convierte SIEMPRE a la unidad del producto del catálogo: gramos→KG (400 g = 0.4), mililitros→LITROS (500 ml = 0.5). Si el producto se cuenta por piezas usa UNIDADES.
- Ejemplo: "4 pastas de 400g" → cantidadUnidades=4, tamano=0.4, unidad="KG", cantidadTotal=1.6, producto="Pasta".
- Ejemplo: "6 latas de atún" (sin peso) → si no hay peso, deja tamano=0 y pon cantidadTotal=6 con la unidad que mejor aplique.
- En "producto" usa el NOMBRE EXACTO del catálogo cuando reconozcas el producto. Si no estás seguro o no está en el catálogo, deja "producto":"" pero conserva el "texto" original.
- No inventes renglones. Si la imagen no tiene una lista de productos, devuelve {"items":[]}.

Catálogo de productos disponibles:
${catalogo}`;

  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instruccion },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.1,
    top_p: 0.7,
    max_tokens: 2048,
    stream: false,
  };

  let resp: Response;
  try {
    resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo contactar el servicio de IA." }, { status: 502 });
  }

  if (!resp.ok) {
    const detalle = await resp.text().catch(() => "");
    return NextResponse.json(
      { error: "El servicio de IA devolvió un error.", detail: detalle.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await resp.json().catch(() => null);
  const contenido: string = data?.choices?.[0]?.message?.content ?? "";
  const parsed = extraerJson(contenido);

  if (!parsed || !Array.isArray(parsed.items)) {
    return NextResponse.json(
      { error: "La IA no pudo leer una lista de productos en la imagen.", raw: contenido.slice(0, 400) },
      { status: 422 }
    );
  }

  // Mapear nombres detectados al producto real del catálogo
  const items = parsed.items.map((it: any) => {
    const nombreIA = String(it.producto || "");
    const nIA = norm(nombreIA);
    let match = nIA
      ? productos.find((p) => norm(p.nombre) === nIA) ||
        productos.find((p) => norm(p.nombre).includes(nIA) || nIA.includes(norm(p.nombre)))
      : undefined;

    const cantidadUnidades = Number(it.cantidadUnidades) || 0;
    const tamano = Number(it.tamano) || 0;
    let cantidadTotal = Number(it.cantidadTotal) || 0;
    if (!cantidadTotal && cantidadUnidades > 0 && tamano > 0) {
      cantidadTotal = parseFloat((cantidadUnidades * tamano).toFixed(4));
    }

    return {
      texto: String(it.texto || "").trim(),
      productoId: match?.id || "",
      productoNombre: match?.nombre || nombreIA,
      unidad: match?.unidad || it.unidad || "UNIDADES",
      cantidadUnidades,
      tamano,
      cantidadTotal,
    };
  });

  return NextResponse.json({ items });
}
