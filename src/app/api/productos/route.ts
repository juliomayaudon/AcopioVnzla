import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(productos);
}

const UNIDADES_VALIDAS = ["KG", "LITROS", "UNIDADES"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "SUPERADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { nombre, categoriaId, unidad, descripcion } = await req.json();
  if (!nombre || !categoriaId || !unidad) {
    return NextResponse.json({ error: "Nombre, categoría y unidad son requeridos" }, { status: 400 });
  }
  if (!UNIDADES_VALIDAS.includes(unidad)) {
    return NextResponse.json({ error: "Unidad inválida" }, { status: 400 });
  }
  const cat = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const existe = await prisma.producto.findFirst({ where: { nombre } });
  if (existe) return NextResponse.json({ error: "Ya existe un producto con ese nombre" }, { status: 409 });

  const producto = await prisma.producto.create({
    data: { nombre, categoriaId, unidad, descripcion: descripcion || null },
    include: { categoria: true },
  });
  return NextResponse.json(producto, { status: 201 });
}
