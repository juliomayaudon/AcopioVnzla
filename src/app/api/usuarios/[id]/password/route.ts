import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin, isAdminPais } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Solo roles que inician sesión pueden tener su contraseña restablecida
const LOGINABLE = ["ADMIN_PAIS", "ADMIN", "COORDINADOR", "SOLO_LECTURA"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauth();

  const rol = session.user.rol;
  if (!["SUPERADMIN", "ADMIN_PAIS", "ADMIN"].includes(rol)) return forbidden();

  const { id } = await params;
  const target = await prisma.usuario.findUnique({
    where: { id },
    include: { centroAcopio: { select: { pais: true } } },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Los voluntarios no inician sesión; los superadmin/admin de país no se restablecen por aquí
  if (!LOGINABLE.includes(target.rol)) {
    return NextResponse.json({ error: "Este usuario no tiene acceso al sistema" }, { status: 400 });
  }

  if (isSuperAdmin(rol)) {
    // SuperAdmin puede restablecer responsables y coordinadores de cualquier centro
  } else if (isAdminPais(rol)) {
    // El admin de país restablece responsables/coordinadores de centros de sus países
    const paisCentro = target.centroAcopio?.pais;
    if (!paisCentro || !(session.user.paisesAdmin || []).includes(paisCentro)) return forbidden();
  } else {
    // El responsable solo restablece coordinadores de su propio centro
    if (target.centroAcopioId !== session.user.centroAcopioId || target.rol !== "COORDINADOR") {
      return forbidden();
    }
  }

  const { password } = await req.json();
  if (!password || String(password).length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  await prisma.usuario.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(String(password), 12) },
  });

  return NextResponse.json({ ok: true });
}
