<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Operación Todos con Venezuela — Sistema de Centros de Acopio

App de gestión de centros de acopio humanitario para Venezuela: registra donaciones, envíos,
consumo interno e inventario; con páginas públicas por centro, dashboards y exportación CSV/PDF.

## Stack
- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Prisma 5** + **PostgreSQL**
- **NextAuth v4** (JWT) · **Tailwind CSS v4**
- **Cloudinary** (imágenes), **recharts** (gráficos), **react-leaflet** (mapas)

## Estructura
- `src/app/`
  - `(protected)/` — páginas con login: `dashboard`, `donaciones`, `envios`, `consumos`, `mi-centro`, `admin` (portal), `catalogo` (categorías/productos, solo superadmin)
  - `centro/[id]/` — página **pública** de cada centro · `login/` · `page.tsx` (homepage pública)
  - `api/` — endpoints REST (donaciones, envios, consumos, usuarios, centros, dashboard, productos, categorias, fotos…)
- `src/components/` — UI reutilizable · `src/lib/` — `auth`, `prisma`, `session`, `permisos`, `donaciones-filtros`, `paises`
- `src/proxy.ts` — protección de rutas (en Next 16 se llama proxy, NO middleware.ts)
- `prisma/schema.prisma` — modelo · `prisma/seed.ts` — categorías, productos, superadmin

## Roles y permisos (`src/lib/permisos.ts`)
- **SUPERADMIN** — todo; gestiona admins de país; único con `/catalogo`
- **ADMIN_PAIS** (UI "Administrador") — global como superadmin, pero crea/edita centros y usuarios **solo de sus países** (`paisesAdmin`); no gestiona otros admins
- **ADMIN** (UI "Responsable") — su centro: dashboard, donaciones, consumo, envíos, mi centro
- **COORDINADOR** — dashboard, donaciones, ver/crear voluntarios de su centro
- **VOLUNTARIO** — sin acceso (solo registro)

Escrituras scopeadas por rol con `resolveCentroDestino` (`src/lib/session.ts`): roles no globales quedan forzados a SU centro.

## Comandos
- `npm run dev` — desarrollo · `npm run build` — build (corre `prisma generate`)
- `npx prisma db push` — sincroniza esquema (este proyecto usa db push, NO migrations)
- `npx tsx prisma/seed.ts` — carga categorías + productos + superadmin

## Variables de entorno (`.env`, NO se commitea — ver `.env.example`)
`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
Seed: `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD` (y `SEED_DEMO=true` para datos de prueba; NO en producción).

## Deployment (Railway)
- Repo de GitHub conectado a Railway: **cada push a `master` redespliega solo**.
- Servicios: Postgres + app. Dominio: `acopiovnzla-production.up.railway.app`.
- Variables Railway: `DATABASE_URL=${{ Postgres.DATABASE_URL }}`, `NEXTAUTH_URL=https://<dominio>`, `NEXTAUTH_SECRET`, `PORT=8080`, Cloudinary.
- Cambios de esquema: editar `schema.prisma` → push → `npx prisma db push` contra la BD (usar la `DATABASE_PUBLIC_URL` de Railway).

## Flujo para cambios
1. Editar código → 2. (opcional) `npm run dev` → 3. `git add -A && git commit && git push` → Railway redespliega.

## Notas de seguridad (auditoría aplicada)
- `.env` y secretos nunca al repo. Autorización por rol en cada API; sin IDOR; validación de entrada; fotos solo imágenes ≤8 MB.
- El superadmin NO puede cambiar su propia contraseña en la app (solo "restablecer" entre roles); su clave se fija vía seed o directo en la BD.
