# Operación — Datos clave y runbook

> Repo **privado**. Aun así, este archivo NO contiene contraseñas ni secretos — solo referencias
> y dónde encontrar cada cosa. Los valores reales viven en Railway / `.env` (nunca en el repo).

## 🌐 Producción
- **App:** https://acopiovnzla-production.up.railway.app
- **Repo:** github.com/juliomayaudon/AcopioVnzla (privado)
- **Hosting:** Railway → 2 servicios: **AcopioVnzla** (la app) + **Postgres** (la base de datos)

## 🔑 Acceso superadmin
- **Email:** `juliomayaudon3000@gmail.com`
- **Contraseña:** la que definiste (NO se guarda aquí). Si la olvidas → ver "Restablecer contraseña" abajo.

## ⚙️ Variables de entorno
- **Producción:** Railway → servicio **AcopioVnzla** → pestaña **Variables**
- **Local:** archivo `.env` (NO se sube al repo; plantilla en `.env.example`)
- **Nombres** (los valores reales viven en Railway, nunca aquí):
  `DATABASE_URL` (= `${{ Postgres.DATABASE_URL }}`), `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (= el dominio https),
  `PORT` (= `8080`), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
  `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

---

## 🛠️ Runbook (tareas comunes)

### Desplegar un cambio de código
```bash
git add -A && git commit -m "descripción" && git push
```
→ Railway redespliega solo en ~2 min.

### Cambiar el esquema de la base de datos (agregar campos/tablas)
1. Editar `prisma/schema.prisma`
2. Railway → servicio **Postgres** → Variables → copiar **`DATABASE_PUBLIC_URL`**
3. En la carpeta del proyecto (PowerShell):
   ```powershell
   $env:DATABASE_URL="<DATABASE_PUBLIC_URL>"; npx prisma db push
   ```
4. `git push` para subir el cambio del schema

### Restablecer la contraseña del superadmin (si la olvidas)
> El superadmin NO puede cambiar su propia clave dentro de la app.
1. Railway → Postgres → Variables → copiar `DATABASE_PUBLIC_URL`
2. Pídele a Claude Code: *"resetea la contraseña del superadmin a [nueva clave]"* (creará un script temporal)
3. Correr con `$env:DATABASE_URL="<url>"; npx tsx <script>.ts`

### Recargar categorías/productos
```powershell
$env:DATABASE_URL="<DATABASE_PUBLIC_URL>"; npx tsx prisma/seed.ts
```
Es idempotente: no borra datos ni cambia la clave del superadmin si ya existe.

---

## 📊 Estado de los datos
- Cargado: **12 categorías**, **93 productos**, **1 superadmin**
- Vacío (se llena con uso real): centros, donaciones, envíos, consumos

## 👥 Roles (resumen)
| Rol | Acceso |
|---|---|
| SUPERADMIN | Todo + catálogo + gestiona admins de país |
| ADMIN_PAIS (UI: "Administrador") | Global, pero crea/edita solo en SUS países |
| ADMIN (UI: "Responsable") | Su centro: todo |
| COORDINADOR | Dashboard, donaciones, ver/crear voluntarios |
| VOLUNTARIO | Sin acceso (solo registro) |

## ⚠️ Seguridad pendiente (cuando puedas)
- Rotar la contraseña de la BD de Railway y las credenciales de Cloudinary (pasaron por desarrollo).
- Considerar rate limiting en el login (a nivel de Railway/Cloudflare).
