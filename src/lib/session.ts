import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function getSession() {
  return getServerSession(authOptions);
}

export const unauth = () => NextResponse.json({ error: "No autorizado" }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "Sin permisos" }, { status: 403 });

export function isSuperAdmin(rol?: string) { return rol === "SUPERADMIN"; }
export function isAdminPais(rol?: string)  { return rol === "ADMIN_PAIS"; }
export function isAdmin(rol?: string)      { return rol === "ADMIN"; }
export function canManage(rol?: string)    { return rol === "SUPERADMIN" || rol === "ADMIN"; }
// Acceso al portal global (superadmin + admin de país)
export function puedePortal(rol?: string)  { return rol === "SUPERADMIN" || rol === "ADMIN_PAIS"; }

// Resuelve el centro destino de una escritura de forma segura:
// roles globales pueden indicar el centro; responsable/coordinador quedan forzados a SU centro.
export function resolveCentroDestino(session: any, bodyCentroId?: string): string | null {
  if (puedePortal(session?.user?.rol)) return bodyCentroId || session?.user?.centroAcopioId || null;
  return session?.user?.centroAcopioId || null;
}
