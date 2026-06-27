import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDonacionesWhere } from "@/lib/donaciones-filtros";

// Escapa un campo para CSV
function csv(v: any): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const where = await buildDonacionesWhere(session, searchParams);

  // Una fila por producto donado, con TODOS los campos (incluidos IDs)
  const donaciones = await prisma.donacion.findMany({
    where,
    include: {
      centroAcopio: {
        select: {
          id: true, nombre: true, ciudad: true, pais: true, direccion: true,
          responsable: true, telefono: true, whatsapp: true, email: true,
        },
      },
      registradoPor: { select: { id: true, nombre: true, email: true } },
      items: { include: { producto: { include: { categoria: true } } } },
    },
    orderBy: { creadoEn: "desc" },
  });

  const headers = [
    // Donación
    "Donación ID", "Fecha", "Hora", "Creado (ISO)", "Donante", "Nacionalidad donante", "Notas donación",
    // Centro
    "Centro ID", "Centro nombre", "Centro ciudad", "Centro país", "Centro dirección",
    "Centro responsable", "Centro teléfono", "Centro WhatsApp", "Centro email",
    // Registrado por
    "Registrado por ID", "Registrado por nombre", "Registrado por email",
    // Item / producto
    "Item ID", "Producto ID", "Producto nombre", "Categoría ID", "Categoría nombre",
    "Unidad", "Cantidad", "N° de unidades", "Notas del item",
  ];

  const rows: string[] = [headers.map(csv).join(",")];

  for (const d of donaciones) {
    const fecha = new Date(d.creadoEn);
    const fechaStr = fecha.toLocaleDateString("es");
    const horaStr = fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    const iso = fecha.toISOString();
    const c = d.centroAcopio;
    const r = d.registradoPor;

    const base = [
      d.id, fechaStr, horaStr, iso, d.donante || "", d.nacionalidadDonante || "", d.notas || "",
      c?.id || "", c?.nombre || "", c?.ciudad || "", c?.pais || "", c?.direccion || "",
      c?.responsable || "", c?.telefono || "", c?.whatsapp || "", c?.email || "",
      r?.id || "", r?.nombre || "", r?.email || "",
    ];

    if (d.items.length === 0) {
      rows.push([...base, "", "", "", "", "", "", "", "", ""].map(csv).join(","));
      continue;
    }
    for (const it of d.items) {
      rows.push([
        ...base,
        it.id,
        it.producto.id,
        it.producto.nombre,
        it.producto.categoria?.id || "",
        it.producto.categoria?.nombre || "",
        it.producto.unidad,
        it.cantidad,
        it.cantidadUnidades ?? "",
        it.notas || "",
      ].map(csv).join(","));
    }
  }

  // BOM para que Excel reconozca UTF-8 (acentos)
  const csvBody = "﻿" + rows.join("\r\n");
  const fechaArchivo = new Date().toISOString().split("T")[0];

  return new NextResponse(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="donaciones_${fechaArchivo}.csv"`,
    },
  });
}
