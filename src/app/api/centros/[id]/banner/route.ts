import { NextRequest, NextResponse } from "next/server";
import { getSession, unauth, forbidden, isSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauth();
  if (!isSuperAdmin(session.user.rol)) return forbidden();

  const { id } = await params;

  if (!process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json(
      { error: "Cloudinary no configurado. Agrega las credenciales en .env" },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "acopio-vzla/banners",
    resource_type: "image",
    transformation: [{ width: 1200, height: 400, crop: "fill", quality: "auto" }],
  });

  const centro = await prisma.centroAcopio.update({
    where: { id },
    data: { bannerUrl: result.secure_url, bannerPublicId: result.public_id },
  });

  return NextResponse.json({ bannerUrl: centro.bannerUrl });
}
