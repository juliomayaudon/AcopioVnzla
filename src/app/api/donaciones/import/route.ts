import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCentroDestino } from "@/lib/session";

// Importación masiva de donaciones desde CSV. El cliente ya resolvió los productoId
// (con emparejado por similitud o IA) y el usuario revisó la vista previa.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { centroAcopioId, donaciones } = await req.json().catch(() => ({}));

  const centroId = resolveCentroDestino(session, centroAcopioId);
  if (!centroId) return NextResponse.json({ error: "Centro de acopio requerido" }, { status: 400 });

  if (!Array.isArray(donaciones) || donaciones.length === 0) {
    return NextResponse.json({ error: "No hay donaciones para importar" }, { status: 400 });
  }
  if (donaciones.length > 2000) {
    return NextResponse.json({ error: "Demasiadas filas (máximo 2000 por importación)" }, { status: 400 });
  }

  // Normalizar y descartar filas sin items válidos
  const limpias = donaciones
    .map((d: any) => {
      const items = Array.isArray(d.items)
        ? d.items
            .filter((i: any) => i?.productoId && Number.isFinite(Number(i.cantidad)) && Number(i.cantidad) > 0)
            .map((i: any) => ({
              productoId: String(i.productoId),
              cantidad: Number(i.cantidad),
              cantidadUnidades:
                Number.isFinite(Number(i.cantidadUnidades)) && Number(i.cantidadUnidades) > 0
                  ? Number(i.cantidadUnidades)
                  : null,
              notas: i.notas ? String(i.notas) : null,
            }))
        : [];
      let creadoEn: Date | undefined;
      if (d.creadoEn) {
        const dt = new Date(d.creadoEn);
        if (!isNaN(dt.getTime())) creadoEn = dt;
      }
      return {
        donante: d.donante ? String(d.donante).slice(0, 200) : null,
        nacionalidadDonante: d.nacionalidadDonante ? String(d.nacionalidadDonante).slice(0, 100) : null,
        notas: d.notas ? String(d.notas).slice(0, 500) : null,
        creadoEn,
        items,
      };
    })
    .filter((d) => d.items.length > 0);

  if (limpias.length === 0) {
    return NextResponse.json({ error: "Ninguna fila tenía un producto y cantidad válidos" }, { status: 400 });
  }

  // Validar que los productos referenciados existan
  const idsProductos = [...new Set(limpias.flatMap((d) => (d.items as any[]).map((i) => i.productoId)))];
  const existentes = await prisma.producto.findMany({ where: { id: { in: idsProductos } }, select: { id: true } });
  const setExist = new Set(existentes.map((p) => p.id));
  const faltan = idsProductos.filter((id) => !setExist.has(id));
  if (faltan.length) {
    return NextResponse.json(
      { error: "Algunos productos no existen en el catálogo", productosInvalidos: faltan },
      { status: 400 }
    );
  }

  // Crear todas las donaciones + acumular el inventario en una sola transacción
  const incrementos: Record<string, number> = {};
  const creadas = await prisma.$transaction(
    async (tx) => {
      let n = 0;
      for (const d of limpias) {
        await tx.donacion.create({
          data: {
            donante: d.donante,
            nacionalidadDonante: d.nacionalidadDonante,
            notas: d.notas,
            ...(d.creadoEn ? { creadoEn: d.creadoEn } : {}),
            centroAcopioId: centroId,
            registradoPorId: session.user.id,
            items: {
              create: d.items.map((i: any) => ({
                productoId: i.productoId,
                cantidad: i.cantidad,
                cantidadUnidades: i.cantidadUnidades,
                notas: i.notas,
              })),
            },
          },
        });
        for (const i of d.items as any[]) incrementos[i.productoId] = (incrementos[i.productoId] || 0) + i.cantidad;
        n++;
      }
      for (const [productoId, cant] of Object.entries(incrementos)) {
        await tx.inventario.upsert({
          where: { centroAcopioId_productoId: { centroAcopioId: centroId, productoId } },
          update: { cantidadTotal: { increment: cant } },
          create: { centroAcopioId: centroId, productoId, cantidadTotal: cant },
        });
      }
      return n;
    },
    { timeout: 45000, maxWait: 10000 }
  );

  return NextResponse.json({ ok: true, creadas });
}
