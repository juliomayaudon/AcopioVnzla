import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin, puedePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// ¿Puede este usuario gestionar este centro? (superadmin: todos; admin país: solo sus países)
async function puedeGestionarCentro(session: any, centroId: string) {
  if (isSuperAdmin(session.user.rol)) return true;
  if (!puedePortal(session.user.rol)) return false;
  const centro = await prisma.centroAcopio.findUnique({ where: { id: centroId }, select: { pais: true } });
  if (!centro) return false;
  return (session.user.paisesAdmin || []).includes(centro.pais);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // GET es público (la página pública del centro lo usa sin login),
  // pero los datos personales de los usuarios (email, nombre) SOLO se exponen
  // a usuarios del portal (superadmin / admin de país). Para el público va solo el conteo.
  const { id } = await params;
  const session = await getSession();
  const incluirUsuarios = !!session && puedePortal(session.user.rol);

  const centro = await prisma.centroAcopio.findUnique({
    where: { id },
    include: {
      ...(incluirUsuarios
        ? {
            usuarios: {
              select: { id: true, nombre: true, rol: true, email: true, activo: true, creadoEn: true },
              orderBy: { creadoEn: "asc" as const },
            },
          }
        : {}),
      _count: { select: { donaciones: true, envios: true, consumos: true, usuarios: { where: { activo: true } } } },
      inventarios: {
        include: { producto: { include: { categoria: true } } },
        orderBy: { cantidadTotal: "desc" },
      },
    },
  });

  if (!centro) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Métricas adicionales para la página pública
  const itemReco = (unidad: string) => ({ donacion: { centroAcopioId: id }, producto: { unidad: unidad as any } });
  const desde = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [recoKg, recoL, recoU, enviosEstado, donacionesRango] = await Promise.all([
    prisma.itemDonacion.aggregate({ where: itemReco("KG"), _sum: { cantidad: true } }),
    prisma.itemDonacion.aggregate({ where: itemReco("LITROS"), _sum: { cantidad: true } }),
    prisma.itemDonacion.aggregate({ where: itemReco("UNIDADES"), _sum: { cantidad: true } }),
    prisma.envio.groupBy({ by: ["estado"], where: { centroAcopioId: id }, _count: true }),
    prisma.donacion.findMany({ where: { centroAcopioId: id, creadoEn: { gte: desde } }, select: { creadoEn: true } }),
  ]);

  const enviosPorEstado: Record<string, number> = { PREPARANDO: 0, EN_TRANSITO: 0, ENTREGADO: 0 };
  for (const e of enviosEstado) enviosPorEstado[e.estado] = (e as any)._count;

  // Donaciones por día (últimos 14 días, rellenando ceros)
  const dayMap: Record<string, number> = {};
  for (const d of donacionesRango) {
    const f = d.creadoEn.toISOString().split("T")[0];
    dayMap[f] = (dayMap[f] || 0) + 1;
  }
  const donacionesPorDia: { fecha: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = dt.toISOString().split("T")[0];
    const label = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
    donacionesPorDia.push({ fecha: label, count: dayMap[key] || 0 });
  }

  return NextResponse.json({
    ...centro,
    recolectado: {
      KG: recoKg._sum.cantidad || 0,
      LITROS: recoL._sum.cantidad || 0,
      UNIDADES: recoU._sum.cantidad || 0,
    },
    enviosPorEstado,
    donacionesPorDia,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauth();

  const { id } = await params;
  if (!(await puedeGestionarCentro(session, id))) return forbidden();

  const body = await req.json();

  // El admin de país no puede mover un centro a un país que no administra
  if (!isSuperAdmin(session.user.rol) && body.pais && !(session.user.paisesAdmin || []).includes(body.pais)) {
    return NextResponse.json({ error: "No puedes asignar ese país" }, { status: 403 });
  }

  // Whitelist de campos editables (evita mass-assignment)
  const data: any = {};
  for (const f of ["nombre", "ciudad", "pais", "direccion", "responsable", "telefono", "whatsapp", "email"]) {
    if (body[f] !== undefined) data[f] = body[f] || null;
  }
  if (body.latitud !== undefined) data.latitud = body.latitud != null ? Number(body.latitud) : null;
  if (body.longitud !== undefined) data.longitud = body.longitud != null ? Number(body.longitud) : null;
  if (typeof body.activo === "boolean") data.activo = body.activo;

  const centro = await prisma.centroAcopio.update({ where: { id }, data });
  return NextResponse.json(centro);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauth();

  const { id } = await params;
  if (!(await puedeGestionarCentro(session, id))) return forbidden();

  await prisma.centroAcopio.update({ where: { id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
