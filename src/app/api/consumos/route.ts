import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCentroDestino } from "@/lib/session";

const ROLES_PERMITIDOS = ["ADMIN", "SUPERADMIN", "ADMIN_PAIS"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const centroId = searchParams.get("centroId");

  const where: any = {};
  if (centroId) where.centroAcopioId = centroId;
  else if (session.user.rol !== "SUPERADMIN" && session.user.centroAcopioId) {
    where.centroAcopioId = session.user.centroAcopioId;
  }

  const consumos = await prisma.consumoInterno.findMany({
    where,
    include: {
      centroAcopio: { select: { nombre: true, ciudad: true } },
      registradoPor: { select: { nombre: true } },
      items: {
        include: { producto: { include: { categoria: true } } },
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  return NextResponse.json(consumos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !ROLES_PERMITIDOS.includes(session.user.rol)) {
    return NextResponse.json({ error: "Solo el responsable del centro puede registrar consumos internos" }, { status: 403 });
  }

  const { motivo, descripcion, centroAcopioId, items } = await req.json();

  const centroId = resolveCentroDestino(session, centroAcopioId);
  if (!centroId) return NextResponse.json({ error: "Centro de acopio requerido" }, { status: 400 });
  if (!items || items.length === 0) return NextResponse.json({ error: "Debe incluir al menos un producto" }, { status: 400 });

  try {
    // El consumo interno es un registro independiente: NO descuenta del inventario
    // ni de las donaciones destinadas a Venezuela. Es un ledger aparte.
    const consumo = await prisma.consumoInterno.create({
      data: {
        motivo,
        descripcion,
        centroAcopioId: centroId,
        registradoPorId: session.user.id,
        items: {
          create: items
            .filter((item: { productoId: string; cantidad: number }) => item.productoId && item.cantidad > 0)
            .map((item: { productoId: string; cantidad: number }) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
            })),
        },
      },
      include: { items: { include: { producto: true } } },
    });

    return NextResponse.json(consumo, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "No se pudo registrar el consumo" }, { status: 400 }
    );
  }
}
