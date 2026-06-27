import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin, puedePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();

  const centros = await prisma.centroAcopio.findMany({
    include: {
      _count: { select: { donaciones: true, usuarios: true, envios: true } },
      usuarios: {
        where: { rol: "ADMIN" },
        select: { id: true, nombre: true, email: true },
        take: 1,
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(centros);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauth();
  if (!puedePortal(session.user.rol)) return forbidden();

  const body = await req.json();

  // Whitelist de campos (evita mass-assignment de campos no permitidos)
  const data: any = {
    nombre: body.nombre,
    ciudad: body.ciudad,
    pais: body.pais,
    direccion: body.direccion || null,
    responsable: body.responsable,
    telefono: body.telefono || null,
    whatsapp: body.whatsapp || null,
    email: body.email || null,
    latitud: body.latitud != null ? Number(body.latitud) : null,
    longitud: body.longitud != null ? Number(body.longitud) : null,
  };
  if (!data.nombre || !data.ciudad || !data.pais || !data.responsable) {
    return NextResponse.json({ error: "Nombre, ciudad, país y responsable son requeridos" }, { status: 400 });
  }

  // El admin de país solo puede crear centros en sus países asignados
  if (!isSuperAdmin(session.user.rol)) {
    const paises = session.user.paisesAdmin || [];
    if (!paises.includes(data.pais)) {
      return NextResponse.json(
        { error: "Solo puedes crear centros en tus países asignados" }, { status: 403 }
      );
    }
  }

  const centro = await prisma.centroAcopio.create({ data });
  return NextResponse.json(centro, { status: 201 });
}
