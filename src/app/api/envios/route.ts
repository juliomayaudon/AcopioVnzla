import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCentroDestino } from "@/lib/session";

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

  const envios = await prisma.envio.findMany({
    where,
    include: {
      centroAcopio: {
        select: {
          nombre: true, ciudad: true, pais: true, direccion: true,
          responsable: true, telefono: true, whatsapp: true, email: true,
        },
      },
      items: { include: { producto: { include: { categoria: true } } } },
      fotos: { select: { id: true, url: true, descripcion: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(envios);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN", "ADMIN_PAIS"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const {
    destino, notas, estado,
    organizacionReceptora, contactoReceptor,
    transportista, tipoTransporte, numeroGuia, placaContenedor, conductor, contactoConductor,
    fechaEnvio, fechaEstimada, fechaEntrega,
    pesoTotal, numeroBultos,
    centroAcopioId, items,
  } = body;

  const centroId = resolveCentroDestino(session, centroAcopioId);
  if (!centroId) return NextResponse.json({ error: "Centro de acopio requerido" }, { status: 400 });
  if (!destino) return NextResponse.json({ error: "Destino requerido" }, { status: 400 });

  const toDate = (v: any) => (v ? new Date(v) : null);
  const validItems = Array.isArray(items)
    ? items.filter((i: any) => i.productoId && i.cantidad > 0)
    : [];

  const envio = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.envio.create({
      data: {
        destino,
        notas: notas || null,
        estado: estado || "PREPARANDO",
        organizacionReceptora: organizacionReceptora || null,
        contactoReceptor: contactoReceptor || null,
        transportista: transportista || null,
        tipoTransporte: tipoTransporte || null,
        numeroGuia: numeroGuia || null,
        placaContenedor: placaContenedor || null,
        conductor: conductor || null,
        contactoConductor: contactoConductor || null,
        fechaEnvio: toDate(fechaEnvio),
        fechaEstimada: toDate(fechaEstimada),
        fechaEntrega: toDate(fechaEntrega),
        pesoTotal: pesoTotal != null && pesoTotal !== "" ? Number(pesoTotal) : null,
        numeroBultos: numeroBultos != null && numeroBultos !== "" ? Number(numeroBultos) : null,
        centroAcopioId: centroId,
        items: {
          create: validItems.map((item: { productoId: string; cantidad: number }) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
          })),
        },
      },
      include: { items: { include: { producto: true } } },
    });

    // Al despachar, el stock del centro disminuye
    for (const item of validItems) {
      await tx.inventario.upsert({
        where: { centroAcopioId_productoId: { centroAcopioId: centroId, productoId: item.productoId } },
        update: { cantidadTotal: { decrement: item.cantidad } },
        create: { centroAcopioId: centroId, productoId: item.productoId, cantidadTotal: 0 },
      });
    }

    return nuevo;
  });

  return NextResponse.json(envio, { status: 201 });
}
