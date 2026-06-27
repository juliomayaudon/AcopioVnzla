import { prisma } from "@/lib/prisma";

// Construye el filtro `where` de donaciones según el rol y los parámetros (país, ciudad, centro, búsqueda, período).
// Reutilizado por el listado paginado y la exportación CSV.
export async function buildDonacionesWhere(session: any, sp: URLSearchParams) {
  const rol = session.user.rol;
  const esGlobal = rol === "SUPERADMIN" || rol === "ADMIN_PAIS";
  const search = sp.get("search")?.trim() ?? "";
  const centroId = sp.get("centroId") ?? "";
  const pais = sp.get("pais") ?? "";
  const ciudad = sp.get("ciudad") ?? "";
  const periodo = sp.get("periodo") ?? "todos";

  const where: any = {};

  // ── Scope por centro ──────────────────────────────────────────────
  if (!esGlobal) {
    // responsable / coordinador: siempre su propio centro
    if (session.user.centroAcopioId) where.centroAcopioId = session.user.centroAcopioId;
  } else {
    // superadmin / admin de país: aplican filtros país/ciudad/centro
    if (centroId) {
      where.centroAcopioId = centroId;
    } else if (pais || ciudad) {
      const cs = await prisma.centroAcopio.findMany({
        where: { ...(pais ? { pais } : {}), ...(ciudad ? { ciudad } : {}) },
        select: { id: true },
      });
      where.centroAcopioId = { in: cs.map((c) => c.id) };
    }
  }

  // ── Búsqueda ──────────────────────────────────────────────────────
  if (search) {
    where.OR = [
      { donante: { contains: search, mode: "insensitive" } },
      { notas: { contains: search, mode: "insensitive" } },
    ];
  }

  // ── Período ───────────────────────────────────────────────────────
  if (periodo !== "todos") {
    const now = new Date();
    let from: Date;
    if (periodo === "hoy") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (periodo === "semana") from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else from = new Date(now.getFullYear(), now.getMonth(), 1);
    where.creadoEn = { gte: from };
  }

  return where;
}
