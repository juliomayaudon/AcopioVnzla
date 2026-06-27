import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const rol = session.user.rol;
  const fPais = sp.get("pais") || "";
  const fCiudad = sp.get("ciudad") || "";
  const fCentro = sp.get("centroId") || "";
  const catList = (sp.get("categorias") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const hasCat = catList.length > 0;

  const esGlobal = rol === "SUPERADMIN" || rol === "ADMIN_PAIS";

  // ── Scope de centros ────────────────────────────────────────────────
  let centroIds: string[] | null = null;
  if (!esGlobal && session.user.centroAcopioId) {
    centroIds = [session.user.centroAcopioId];
  } else if (esGlobal) {
    const where: any = {};
    if (fCentro) where.id = fCentro;
    if (fPais) where.pais = fPais;
    if (fCiudad) where.ciudad = fCiudad;
    if (Object.keys(where).length > 0) {
      const cs = await prisma.centroAcopio.findMany({ where, select: { id: true } });
      centroIds = cs.map((c) => c.id);
    }
  }

  const centroScope: any = centroIds ? { centroAcopioId: { in: centroIds } } : {};

  // ── Filtro por categoría ────────────────────────────────────────────
  // someCat → registros (donación/envío/consumo) que tengan al menos un ítem de esas categorías
  const someCat: any = hasCat ? { items: { some: { producto: { categoria: { nombre: { in: catList } } } } } } : {};
  // catItem → ítems/inventario de esas categorías
  const catItem: any = hasCat ? { producto: { categoria: { nombre: { in: catList } } } } : {};

  const donEnvWhere: any = { ...centroScope, ...someCat }; // donaciones / envíos / consumos
  const invWhere: any = { ...centroScope, cantidadTotal: { gt: 0 }, ...catItem };
  const itemScope: any = {
    ...(centroIds ? { donacion: { centroAcopioId: { in: centroIds } } } : {}),
    ...catItem,
  };

  const centroWhere: any = { activo: true };
  if (centroIds) centroWhere.id = { in: centroIds };

  const desde = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalDonaciones,
    totalCentros,
    totalUsuarios,
    totalEnvios,
    totalConsumos,
    inventarios,
    donacionesRango,
    enviosPorEstadoRaw,
    centrosStats,
    recolectadoKg,
    recolectadoL,
    recolectadoU,
  ] = await Promise.all([
    prisma.donacion.count({ where: donEnvWhere }),
    prisma.centroAcopio.count({ where: centroWhere }),
    prisma.usuario.count({ where: { activo: true, ...(centroIds ? { centroAcopioId: { in: centroIds } } : {}) } }),
    prisma.envio.count({ where: donEnvWhere }),
    prisma.consumoInterno.count({ where: donEnvWhere }),
    prisma.inventario.findMany({
      where: invWhere,
      include: { producto: { include: { categoria: true } } },
      orderBy: { cantidadTotal: "desc" },
    }),
    prisma.donacion.findMany({
      where: { ...donEnvWhere, creadoEn: { gte: desde } },
      select: { creadoEn: true },
      orderBy: { creadoEn: "asc" },
    }),
    prisma.envio.groupBy({ by: ["estado"], where: donEnvWhere, _count: true }),
    prisma.centroAcopio.findMany({
      where: centroWhere,
      include: {
        _count: { select: { donaciones: true, usuarios: true, envios: true } },
        inventarios: { select: { cantidadTotal: true } },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.itemDonacion.aggregate({ where: { ...itemScope, producto: { ...(catItem.producto || {}), unidad: "KG" } }, _sum: { cantidad: true } }),
    prisma.itemDonacion.aggregate({ where: { ...itemScope, producto: { ...(catItem.producto || {}), unidad: "LITROS" } }, _sum: { cantidad: true } }),
    prisma.itemDonacion.aggregate({ where: { ...itemScope, producto: { ...(catItem.producto || {}), unidad: "UNIDADES" } }, _sum: { cantidad: true } }),
  ]);

  // ── Donaciones por día (últimos 14 días) ────────────────────────────
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

  // ── Envíos por estado ───────────────────────────────────────────────
  const enviosPorEstado: Record<string, number> = { PREPARANDO: 0, EN_TRANSITO: 0, ENTREGADO: 0 };
  for (const e of enviosPorEstadoRaw) enviosPorEstado[e.estado] = (e as any)._count;

  return NextResponse.json({
    totalDonaciones,
    totalCentros,
    totalUsuarios,
    totalEnvios,
    totalConsumos,
    recolectado: {
      KG: recolectadoKg._sum.cantidad || 0,
      LITROS: recolectadoL._sum.cantidad || 0,
      UNIDADES: recolectadoU._sum.cantidad || 0,
    },
    inventariosTop: inventarios,
    donacionesPorDia,
    enviosPorEstado,
    centrosStats: centrosStats.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      ciudad: c.ciudad,
      pais: c.pais,
      donaciones: c._count.donaciones,
      voluntarios: c._count.usuarios,
      envios: c._count.envios,
      totalItems: c.inventarios.reduce((sum, inv) => sum + inv.cantidadTotal, 0),
    })),
  });
}
