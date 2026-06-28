import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Registro público de un voluntario, asociado a un centro de acopio existente.
// El voluntario NO inicia sesión (no tiene credenciales); queda registrado para que el centro lo contacte.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { centroAcopioId, nombre, email, telefono, nacionalidad, paisResidencia, ciudad, edad } = body;

  if (!centroAcopioId || !nombre?.trim()) {
    return NextResponse.json({ error: "Selecciona un centro e indica tu nombre" }, { status: 400 });
  }
  if (!telefono?.trim()) {
    return NextResponse.json({ error: "El teléfono de contacto es requerido" }, { status: 400 });
  }

  const centro = await prisma.centroAcopio.findUnique({
    where: { id: centroAcopioId },
    select: { id: true, activo: true },
  });
  if (!centro || !centro.activo) {
    return NextResponse.json({ error: "El centro seleccionado no está disponible" }, { status: 404 });
  }

  const emailLimpio = email?.trim().toLowerCase() || null;
  if (emailLimpio) {
    const existe = await prisma.usuario.findUnique({ where: { email: emailLimpio } });
    if (existe) return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  }

  const edadNum = edad != null && edad !== "" ? parseInt(String(edad), 10) : null;

  await prisma.usuario.create({
    data: {
      nombre: String(nombre).trim(),
      email: emailLimpio,
      passwordHash: null,
      rol: "VOLUNTARIO",
      centroAcopioId,
      nacionalidad: nacionalidad?.trim() || null,
      paisResidencia: paisResidencia?.trim() || null,
      ciudad: ciudad?.trim() || null,
      edad: Number.isFinite(edadNum as number) ? edadNum : null,
      telefono: String(telefono).trim(),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
