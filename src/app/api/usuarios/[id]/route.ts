import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin, isAdminPais } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauth();

  const rol = session.user.rol;
  if (!["SUPERADMIN", "ADMIN_PAIS", "ADMIN", "COORDINADOR"].includes(rol)) return forbidden();

  const { id } = await params;
  const target = await prisma.usuario.findUnique({
    where: { id },
    include: { centroAcopio: { select: { pais: true } } },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (isAdminPais(rol)) {
    // No puede tocar superadmins ni otros admins de país
    if (target.rol === "SUPERADMIN" || target.rol === "ADMIN_PAIS") return forbidden();
    // El usuario objetivo debe pertenecer a un centro de sus países
    const paisCentro = target.centroAcopio?.pais;
    if (!paisCentro || !(session.user.paisesAdmin || []).includes(paisCentro)) return forbidden();
  }
  if (rol === "ADMIN") {
    if (target.centroAcopioId !== session.user.centroAcopioId) return forbidden();
    if (target.rol === "ADMIN" || target.rol === "ADMIN_PAIS" || target.rol === "SUPERADMIN") return forbidden();
  }
  if (rol === "COORDINADOR") {
    // El coordinador solo gestiona voluntarios de su propio centro
    if (target.centroAcopioId !== session.user.centroAcopioId) return forbidden();
    if (target.rol !== "VOLUNTARIO") return forbidden();
  }

  const body = await req.json();

  // Whitelist de campos editables (nunca rol/email/contraseña/centro por aquí salvo superadmin)
  const data: any = {};
  if (typeof body.activo === "boolean") data.activo = body.activo;
  for (const f of ["nombre", "nacionalidad", "paisResidencia", "ciudad", "telefono"]) {
    if (body[f] !== undefined) data[f] = body[f] || null;
  }
  if (body.edad !== undefined) {
    const n = body.edad === "" || body.edad == null ? null : parseInt(String(body.edad), 10);
    data.edad = Number.isFinite(n as number) ? n : null;
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  return NextResponse.json(updated);
}
