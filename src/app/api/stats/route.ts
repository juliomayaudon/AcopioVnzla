import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [centros, donaciones, usuarios, items] = await Promise.all([
    prisma.centroAcopio.count({ where: { activo: true } }),
    prisma.donacion.count(),
    prisma.usuario.count({ where: { activo: true, rol: { notIn: ["SUPERADMIN"] } } }),
    prisma.itemDonacion.aggregate({ _sum: { cantidad: true } }),
  ]);

  return NextResponse.json({
    centros,
    donaciones,
    usuarios,
    items: Math.round(items._sum.cantidad ?? 0),
  });
}
