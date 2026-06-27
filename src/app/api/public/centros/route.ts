import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const soloActivos = searchParams.get("activos") !== "false";

  const centros = await prisma.centroAcopio.findMany({
    where: soloActivos ? { activo: true } : undefined,
    select: {
      id: true,
      nombre: true,
      ciudad: true,
      pais: true,
      direccion: true,
      latitud: true,
      longitud: true,
      responsable: true,
      whatsapp: true,
      bannerUrl: true,
      activo: true,
      // "usuarios" = miembros activos del centro (responsable + coordinadores + voluntarios)
      _count: { select: { donaciones: true, usuarios: { where: { activo: true } } } },
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(centros);
}
