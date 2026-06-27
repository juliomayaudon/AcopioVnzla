import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDonacionesWhere } from "@/lib/donaciones-filtros";
import { resolveCentroDestino } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

  const where = await buildDonacionesWhere(session, searchParams);

  const [total, donaciones] = await Promise.all([
    prisma.donacion.count({ where }),
    prisma.donacion.findMany({
      where,
      include: {
        centroAcopio: { select: { nombre: true, ciudad: true, pais: true } },
        registradoPor: { select: { nombre: true } },
        items: { include: { producto: { include: { categoria: true } } } },
        fotos: { select: { id: true, url: true, descripcion: true } },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: donaciones,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { donante, nacionalidadDonante, notas, centroAcopioId, items } = await req.json();

  const centroId = resolveCentroDestino(session, centroAcopioId);
  if (!centroId) return NextResponse.json({ error: "Centro de acopio requerido" }, { status: 400 });

  // Validar items: solo cantidades positivas y finitas (evita restar inventario con negativos)
  const validItems = Array.isArray(items)
    ? items
        .filter((i: any) => i?.productoId && Number.isFinite(Number(i.cantidad)) && Number(i.cantidad) > 0)
        .map((i: any) => ({
          productoId: String(i.productoId),
          cantidad: Number(i.cantidad),
          cantidadUnidades: Number.isFinite(Number(i.cantidadUnidades)) && Number(i.cantidadUnidades) > 0 ? Number(i.cantidadUnidades) : null,
          notas: i.notas ? String(i.notas) : null,
        }))
    : [];
  if (validItems.length === 0) {
    return NextResponse.json({ error: "Debe incluir al menos un producto con cantidad válida" }, { status: 400 });
  }

  const donacion = await prisma.$transaction(async (tx) => {
    const nuevaDonacion = await tx.donacion.create({
      data: {
        donante: donante || null,
        nacionalidadDonante: nacionalidadDonante || null,
        notas: notas || null,
        centroAcopioId: centroId,
        registradoPorId: session.user.id,
        items: {
          create: validItems.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            cantidadUnidades: item.cantidadUnidades,
            notas: item.notas,
          })),
        },
      },
      include: { items: { include: { producto: true } } },
    });

    for (const item of validItems) {
      await tx.inventario.upsert({
        where: { centroAcopioId_productoId: { centroAcopioId: centroId, productoId: item.productoId } },
        update: { cantidadTotal: { increment: item.cantidad } },
        create: { centroAcopioId: centroId, productoId: item.productoId, cantidadTotal: item.cantidad },
      });
    }

    return nuevaDonacion;
  });

  return NextResponse.json(donacion, { status: 201 });
}
