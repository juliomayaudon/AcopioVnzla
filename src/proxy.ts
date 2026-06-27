import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/centros",
  "/api/stats",
  "/api/public",
  "/centro",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // La homepage pública es exactamente "/"
  if (pathname === "/") return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpe?g$|.*\\.webp$|.*\\.gif$|.*\\.svg$|.*\\.css$|.*\\.js$).*)"],
};
