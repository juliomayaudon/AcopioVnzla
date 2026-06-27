import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const donacionId = (formData.get("donacionId") as string) || null;
  const envioId = (formData.get("envioId") as string) || null;
  const descripcion = (formData.get("descripcion") as string) || null;

  if (!file || (!donacionId && !envioId)) {
    return NextResponse.json({ error: "Archivo y donación o envío requeridos" }, { status: 400 });
  }

  // Validación: solo imágenes, máx 8 MB
  if (!file.type?.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 8 MB" }, { status: 400 });
  }

  // El registro relacionado debe existir
  if (donacionId) {
    const d = await prisma.donacion.findUnique({ where: { id: donacionId }, select: { id: true } });
    if (!d) return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
  }
  if (envioId) {
    const e = await prisma.envio.findUnique({ where: { id: envioId }, select: { id: true } });
    if (!e) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(base64, {
    folder: "acopio-vzla",
    resource_type: "image",
  });

  const foto = await prisma.foto.create({
    data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      descripcion,
      donacionId,
      envioId,
    },
  });

  return NextResponse.json(foto, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const centroId = searchParams.get("centroId");

  const fotos = await prisma.foto.findMany({
    where: centroId
      ? { donacion: { centroAcopioId: centroId } }
      : undefined,
    include: {
      donacion: {
        select: {
          id: true,
          donante: true,
          creadoEn: true,
          centroAcopio: { select: { nombre: true, ciudad: true } },
        },
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  return NextResponse.json(fotos);
}
