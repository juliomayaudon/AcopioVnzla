import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ayuda OPCIONAL con IA: dado un conjunto de textos libres (nombres de producto de un CSV),
// sugiere a qué producto del catálogo corresponde cada uno. Usa un modelo de texto de NVIDIA.
export const maxDuration = 60;

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La IA no está configurada en el servidor (falta NVIDIA_API_KEY)." },
      { status: 503 }
    );
  }

  const { nombres } = await req.json().catch(() => ({}));
  if (!Array.isArray(nombres) || !nombres.length) return NextResponse.json({ matches: {} });
  const textos = [...new Set(nombres.map((n: any) => String(n || "").trim()).filter(Boolean))].slice(0, 200);
  if (!textos.length) return NextResponse.json({ matches: {} });

  const productos = await prisma.producto.findMany({ select: { id: true, nombre: true } });
  const catalogo = productos.map((p) => `${p.id}: ${p.nombre}`).join("\n");
  const lista = textos.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const model = process.env.NVIDIA_TEXT_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1";
  const prompt = `Tienes un catálogo de productos de ayuda humanitaria (id: nombre):
${catalogo}

Para cada texto de la lista de abajo, indica el id del producto del catálogo que MEJOR corresponde (considera sinónimos, plurales, diminutivos y errores de escritura en español). Si ninguno corresponde con seguridad, deja el id vacío.

Responde con un objeto JSON por cada texto, con esta forma EXACTA y nada más de texto alrededor:
{"t":"<texto original tal cual>","id":"<id del catálogo o vacío>"}

Lista de textos:
${lista}`;

  let resp: Response;
  try {
    resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "detailed thinking off" },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 3000,
      }),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo contactar el servicio de IA." }, { status: 502 });
  }
  if (!resp.ok) {
    const detalle = await resp.text().catch(() => "");
    return NextResponse.json({ error: "El servicio de IA devolvió un error.", detail: detalle.slice(0, 200) }, { status: 502 });
  }

  const data = await resp.json().catch(() => null);
  const content: string = data?.choices?.[0]?.message?.content ?? "";

  // Extrae todos los pares {"t":"...","id":"..."} sin importar el orden ni el texto extra alrededor
  const setIds = new Set(productos.map((p) => p.id));
  const re =
    /\{[^{}]*?"t"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*?"id"\s*:\s*"([^"]*)"[^{}]*?\}|\{[^{}]*?"id"\s*:\s*"([^"]*)"[^{}]*?"t"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*?\}/g;
  const porNorm: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const t = (m[1] ?? m[4] ?? "").replace(/\\"/g, '"');
    const id = (m[2] ?? m[3] ?? "").trim();
    if (!t) continue;
    porNorm[norm(t)] = setIds.has(id) ? id : "";
  }

  const matches: Record<string, string> = {};
  for (const t of textos) matches[t] = porNorm[norm(t)] ?? "";

  return NextResponse.json({ matches });
}
