import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "SUPERADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { nombre, descripcion } = await req.json();
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre de la categoría es requerido" }, { status: 400 });
  }
  const existe = await prisma.categoria.findUnique({ where: { nombre: nombre.trim() } });
  if (existe) return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });

  const categoria = await prisma.categoria.create({
    data: { nombre: nombre.trim(), descripcion: descripcion || null, icono: "" },
  });
  return NextResponse.json(categoria, { status: 201 });
}
