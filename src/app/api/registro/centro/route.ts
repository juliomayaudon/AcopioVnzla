import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Registro público de un centro de acopio. El que lo crea queda como Responsable (ADMIN) del centro.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const c = body.centro || {};
  const r = body.responsable || {};

  // ── Validación ──────────────────────────────────────────────────────
  if (!c.nombre?.trim() || !c.pais?.trim() || !c.ciudad?.trim()) {
    return NextResponse.json({ error: "Completa nombre, país y ciudad del centro" }, { status: 400 });
  }
  if (!r.nombre?.trim() || !r.email?.trim() || !r.password) {
    return NextResponse.json({ error: "Completa nombre, email y contraseña del responsable" }, { status: 400 });
  }
  if (String(r.password).length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }
  const email = String(r.email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });

  const edadNum = r.edad != null && r.edad !== "" ? parseInt(String(r.edad), 10) : null;
  const passwordHash = await bcrypt.hash(String(r.password), 12);

  const result = await prisma.$transaction(async (tx) => {
    const centro = await tx.centroAcopio.create({
      data: {
        nombre: String(c.nombre).trim(),
        ciudad: String(c.ciudad).trim(),
        pais: String(c.pais).trim(),
        direccion: c.direccion?.trim() || null,
        responsable: String(r.nombre).trim(),
        telefono: r.telefono?.trim() || null,
        whatsapp: c.whatsapp?.trim() || null,
        email,
        latitud: c.latitud != null ? Number(c.latitud) : null,
        longitud: c.longitud != null ? Number(c.longitud) : null,
        activo: true,
      },
    });
    await tx.usuario.create({
      data: {
        nombre: String(r.nombre).trim(),
        email,
        passwordHash,
        rol: "ADMIN",
        centroAcopioId: centro.id,
        nacionalidad: r.nacionalidad?.trim() || null,
        paisResidencia: r.paisResidencia?.trim() || null,
        ciudad: r.ciudad?.trim() || null,
        edad: Number.isFinite(edadNum as number) ? edadNum : null,
        telefono: r.telefono?.trim() || null,
      },
    });
    return centro;
  });

  return NextResponse.json({ ok: true, centroId: result.id }, { status: 201 });
}
