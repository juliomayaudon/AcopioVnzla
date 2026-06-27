import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin, isAdminPais } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Roles que cada rol puede crear
const ROLES_CREABLES: Record<string, string[]> = {
  SUPERADMIN: ["ADMIN_PAIS", "ADMIN", "COORDINADOR", "VOLUNTARIO"],
  ADMIN_PAIS: ["ADMIN", "COORDINADOR", "VOLUNTARIO"],
  ADMIN: ["COORDINADOR", "VOLUNTARIO"],
  COORDINADOR: ["VOLUNTARIO"],
};

const USER_SELECT = {
  id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true,
  nacionalidad: true, paisResidencia: true, ciudad: true, edad: true, telefono: true,
  paisesAdmin: true,
  centroAcopio: { select: { id: true, nombre: true, ciudad: true, pais: true } },
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();

  const rol = session.user.rol;

  // SuperAdmin y Admin de país ven todos los usuarios (vista global)
  if (isSuperAdmin(rol) || isAdminPais(rol)) {
    const usuarios = await prisma.usuario.findMany({
      select: USER_SELECT,
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(usuarios);
  }

  if (rol === "ADMIN") {
    const usuarios = await prisma.usuario.findMany({
      where: { centroAcopioId: session.user.centroAcopioId! },
      select: USER_SELECT,
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(usuarios);
  }

  if (rol === "COORDINADOR") {
    const usuarios = await prisma.usuario.findMany({
      where: { centroAcopioId: session.user.centroAcopioId!, rol: "VOLUNTARIO" },
      select: USER_SELECT,
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(usuarios);
  }

  return forbidden();
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauth();

  const rol = session.user.rol;
  const creables = ROLES_CREABLES[rol] || [];
  if (creables.length === 0) return forbidden();

  const body = await req.json();
  const {
    nombre, email, password, rol: nuevoRol, centroAcopioId,
    nacionalidad, paisResidencia, ciudad, edad, telefono, paisesAdmin,
  } = body;

  if (!nombre || !nuevoRol) {
    return NextResponse.json({ error: "Nombre y rol son requeridos" }, { status: 400 });
  }
  if (!creables.includes(nuevoRol)) {
    return NextResponse.json({ error: "No puedes crear un usuario con ese rol" }, { status: 403 });
  }

  // El voluntario no necesita credenciales; los demás roles inician sesión
  const esVoluntario = nuevoRol === "VOLUNTARIO";
  if (!esVoluntario && (!email || !password)) {
    return NextResponse.json({ error: "Email y contraseña son requeridos para este rol" }, { status: 400 });
  }

  // ── Países que administra el nuevo usuario (solo si es ADMIN_PAIS) ──
  let paisesNuevoAdmin: string[] = [];
  if (nuevoRol === "ADMIN_PAIS") {
    paisesNuevoAdmin = Array.isArray(paisesAdmin) ? paisesAdmin.filter(Boolean) : [];
    if (paisesNuevoAdmin.length === 0) {
      return NextResponse.json({ error: "Asigna al menos un país al administrador" }, { status: 400 });
    }
  }

  // ── Centro destino del nuevo usuario ──
  let centroDestino: string | null = null;
  if (isSuperAdmin(rol)) {
    centroDestino = centroAcopioId || null;
  } else if (isAdminPais(rol)) {
    centroDestino = centroAcopioId || null;
    // Si asigna un centro, debe estar en sus países
    if (centroDestino) {
      const centro = await prisma.centroAcopio.findUnique({ where: { id: centroDestino }, select: { pais: true } });
      if (!centro || !(session.user.paisesAdmin || []).includes(centro.pais)) {
        return NextResponse.json({ error: "Solo puedes crear usuarios en centros de tus países" }, { status: 403 });
      }
    }
  } else {
    // ADMIN (responsable) y COORDINADOR: solo su propio centro
    centroDestino = session.user.centroAcopioId || null;
    if (centroAcopioId && centroAcopioId !== session.user.centroAcopioId) {
      return NextResponse.json({ error: "Solo puedes crear usuarios para tu centro" }, { status: 403 });
    }
  }

  // Email único (si se proporcionó)
  if (email) {
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }
  }

  const edadNum = edad != null && edad !== "" ? parseInt(String(edad), 10) : null;

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email: email || null,
      passwordHash: password ? await bcrypt.hash(password, 12) : null,
      rol: nuevoRol,
      centroAcopioId: nuevoRol === "ADMIN_PAIS" ? null : centroDestino,
      paisesAdmin: paisesNuevoAdmin,
      nacionalidad: nacionalidad || null,
      paisResidencia: paisResidencia || null,
      ciudad: ciudad || null,
      edad: Number.isFinite(edadNum as number) ? edadNum : null,
      telefono: telefono || null,
    },
    select: USER_SELECT,
  });

  return NextResponse.json(usuario, { status: 201 });
}
