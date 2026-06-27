import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Solo usuarios autenticados (evita usar el servidor como proxy abierto a Nominatim)
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=es`,
      {
        headers: {
          "User-Agent": "AcopioVnzla/1.0 (sistema humanitario de acopio)",
          "Accept": "application/json",
        },
        // Nominatim asks for max 1 req/s — a server-side call is safer
        next: { revalidate: 0 },
      }
    );
    if (!r.ok) return NextResponse.json([]);
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
