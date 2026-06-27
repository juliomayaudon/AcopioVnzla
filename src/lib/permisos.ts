// Modelo de permisos por rol
//
// SUPERADMIN  → todo (portal global, gestiona Admins de país)
// ADMIN_PAIS  → Admin de país: ve todo global como el superadmin, pero solo crea/edita
//               centros y usuarios de sus países. No gestiona otros Admins de país.
// ADMIN       → Responsable del centro: Dashboard, Donaciones, Consumo Interno, Envíos, Mi Centro
// COORDINADOR → Dashboard, Donaciones, Mi Centro (limitado: solo ver/agregar voluntarios)
// VOLUNTARIO  → sin acceso al sistema (solo queda registrado)

export type Rol = "SUPERADMIN" | "ADMIN_PAIS" | "ADMIN" | "COORDINADOR" | "VOLUNTARIO" | "SOLO_LECTURA";

export const ROL_LABEL: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN_PAIS: "Administrador",
  ADMIN: "Responsable",
  COORDINADOR: "Coordinador",
  VOLUNTARIO: "Voluntario",
  SOLO_LECTURA: "Solo Lectura",
};

export const ROL_BADGE: Record<string, "warning" | "info" | "success" | "default" | "danger"> = {
  SUPERADMIN: "danger",
  ADMIN_PAIS: "success",
  ADMIN: "warning",
  COORDINADOR: "info",
  VOLUNTARIO: "default",
  SOLO_LECTURA: "default",
};

const has = (rol: string | undefined, roles: string[]) => !!rol && roles.includes(rol);

export const puedeDashboard  = (rol?: string) => has(rol, ["SUPERADMIN", "ADMIN_PAIS", "ADMIN", "COORDINADOR"]);
export const puedeDonaciones = (rol?: string) => has(rol, ["SUPERADMIN", "ADMIN_PAIS", "ADMIN", "COORDINADOR"]);
export const puedeConsumos   = (rol?: string) => has(rol, ["SUPERADMIN", "ADMIN_PAIS", "ADMIN"]);
export const puedeEnvios     = (rol?: string) => has(rol, ["SUPERADMIN", "ADMIN_PAIS", "ADMIN"]);
export const puedeMiCentro   = (rol?: string) => has(rol, ["ADMIN", "COORDINADOR"]);

// Acceso al portal de administración (global): superadmin y admins de país
export const puedePortalAdmin = (rol?: string) => has(rol, ["SUPERADMIN", "ADMIN_PAIS"]);
// Solo el superadmin gestiona Admins de país
export const esSuperAdmin     = (rol?: string) => rol === "SUPERADMIN";
// ¿Tiene control total del centro (info, coordinadores, todos los usuarios)?
export const esResponsable    = (rol?: string) => has(rol, ["ADMIN"]);

// Roles que cada quien puede crear
export function rolesQuePuedeCrear(rol?: string): string[] {
  if (rol === "SUPERADMIN") return ["ADMIN_PAIS", "ADMIN", "COORDINADOR", "VOLUNTARIO"];
  if (rol === "ADMIN_PAIS") return ["ADMIN", "COORDINADOR", "VOLUNTARIO"];
  if (rol === "ADMIN")      return ["COORDINADOR", "VOLUNTARIO"];
  if (rol === "COORDINADOR") return ["VOLUNTARIO"];
  return [];
}
