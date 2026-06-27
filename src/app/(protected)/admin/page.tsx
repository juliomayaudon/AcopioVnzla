"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield, Building2, Plus, Users, Pencil, Power, X, ChevronDown, ChevronUp, ImagePlus, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField, ResetPasswordModal } from "@/components/password-field";
import { PaisesMultiSelect } from "@/components/paises-multiselect";
import { Pagination } from "@/components/pagination";
import { formatDate } from "@/lib/utils";

const PER_PAGE = 20;
import {
  ROL_LABEL, ROL_BADGE, rolesQuePuedeCrear, puedePortalAdmin, esSuperAdmin,
} from "@/lib/permisos";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[338px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  ),
});

// ── Modal genérico ────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Formulario Centro ─────────────────────────────────────────────
function CentroForm({ initial, onSave, onClose, esSuper = true, paisesAdmin = [] }: {
  initial?: any; onSave: (d: any) => Promise<void>; onClose: () => void;
  esSuper?: boolean; paisesAdmin?: string[];
}) {
  const [form, setForm] = useState({
    nombre: initial?.nombre || "", ciudad: initial?.ciudad || "",
    pais: initial?.pais || (!esSuper && paisesAdmin.length === 1 ? paisesAdmin[0] : ""),
    direccion: initial?.direccion || "",
    responsable: initial?.responsable || "", telefono: initial?.telefono || "",
    whatsapp: initial?.whatsapp || "",
    email: initial?.email || "",
    latitud: initial?.latitud ?? null as number | null,
    longitud: initial?.longitud ?? null as number | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bannerWarning, setBannerWarning] = useState("");
  // Banner upload
  const [bannerPreview, setBannerPreview] = useState<string>(initial?.bannerUrl || "");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const uploadBanner = async (centroId: string) => {
    if (!bannerFile) return;
    setUploadingBanner(true);
    const fd = new FormData();
    fd.append("file", bannerFile);
    const r = await fetch(`/api/centros/${centroId}/banner`, { method: "POST", body: fd });
    setUploadingBanner(false);
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.error || "Error subiendo banner");
    }
  };

  return (
    <form onSubmit={async e => {
      e.preventDefault(); setLoading(true); setError(""); setBannerWarning("");
      try {
        // 1. Guardar datos del centro
        const result = await onSave(form);

        // 2. Subir banner por separado — si falla, el centro igual queda guardado
        if (bannerFile) {
          const centroId = (result as any)?.id || initial?.id;
          if (centroId) {
            try {
              await uploadBanner(centroId);
            } catch (bannerErr: any) {
              // Centro guardado, solo el banner falló
              setBannerWarning(bannerErr.message || "No se pudo subir el banner");
              setLoading(false);
              return; // no cerramos el modal para que vea la advertencia
            }
          }
        }
        onClose();
      }
      catch (err: any) { setError(err.message || "Error al guardar"); }
      finally { setLoading(false); }
    }} className="space-y-4">

      {/* Banner */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen / Banner del centro</label>
        <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#1B3078] transition-colors group cursor-pointer"
          style={{ height: 140 }}
          onClick={() => document.getElementById("banner-input")?.click()}>
          {bannerPreview
            ? <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-2">
                <ImagePlus size={28} className="text-gray-300 group-hover:text-[#1B3078] transition-colors" />
                <p className="text-xs text-gray-400">Haz clic para subir una imagen (1200×400 recomendado)</p>
              </div>
            )}
          {uploadingBanner && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          {bannerPreview && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Cambiar imagen</p>
            </div>
          )}
        </div>
        <input id="banner-input" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
        {bannerFile && !initial && (
          <p className="text-xs text-amber-600 mt-1">⚠ El banner se subirá después de guardar el centro</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Input label="Nombre del centro *" value={form.nombre} onChange={set("nombre")} required /></div>
        <Input label="Ciudad *" value={form.ciudad} onChange={set("ciudad")} required />
        {esSuper ? (
          <Input label="País *" value={form.pais} onChange={set("pais")} required />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País *</label>
            <select value={form.pais} onChange={set("pais")} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3078]">
              <option value="">Seleccionar país...</option>
              {paisesAdmin.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
        <div className="col-span-2"><Input label="Dirección" value={form.direccion} onChange={set("direccion")} /></div>
        <Input label="Responsable *" value={form.responsable} onChange={set("responsable")} required />
        <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
        <div className="col-span-2">
          <Input
            label="WhatsApp de contacto (con código de país)"
            value={form.whatsapp}
            onChange={set("whatsapp")}
            placeholder="+58 424 123 4567"
          />
          <p className="text-xs text-gray-400 mt-1">
            Este número se usará para que voluntarios contacten al centro. Incluye el código del país (ej: +58 para Venezuela, +1 para EEUU).
          </p>
        </div>
        <div className="col-span-2"><Input label="Email" type="email" value={form.email} onChange={set("email")} /></div>
      </div>

      {/* Ubicación en el mapa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación en el mapa
          <span className="ml-1 text-xs font-normal text-gray-400">— busca una dirección o haz clic en el mapa</span>
        </label>
        <LocationPicker
          initialLat={form.latitud}
          initialLng={form.longitud}
          onPick={(lat, lng) => setForm(f => ({ ...f, latitud: lat, longitud: lng }))}
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {bannerWarning && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 space-y-1">
          <p className="font-semibold text-amber-800">Centro guardado, pero el banner no se subió</p>
          <p className="text-amber-700 text-xs">{bannerWarning}</p>
          <p className="text-amber-600 text-xs mt-1">
            Para activar las imágenes, añade tus credenciales de Cloudinary en el archivo <strong>.env</strong> y reinicia el servidor.
          </p>
          <button type="button" onClick={onClose}
            className="mt-2 text-xs font-medium text-amber-800 underline">
            Cerrar y continuar sin banner
          </button>
        </div>
      )}
      {!bannerWarning && (
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? "Guardar cambios" : "Crear centro"}</Button>
        </div>
      )}
    </form>
  );
}

// ── Formulario Usuario ────────────────────────────────────────────
function UsuarioForm({ centroId, centroNombre, rolesDisponibles, filtrarPaises, onSave, onClose }: {
  centroId?: string; centroNombre?: string;
  rolesDisponibles: string[];
  filtrarPaises?: string[] | null; // si se pasa, solo centros de estos países (creador = admin de país)
  onSave: (d: any) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", rol: rolesDisponibles[0] || "ADMIN",
    centroAcopioId: centroId || "", paisesAdminSel: [] as string[],
    nacionalidad: "", paisResidencia: "", ciudad: "", edad: "", telefono: "",
  });
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!centroId) fetch("/api/centros").then(r => r.json()).then(d => { if (Array.isArray(d)) setCentros(d); });
  }, [centroId]);

  const esVoluntario = form.rol === "VOLUNTARIO";
  const esAdminPais  = form.rol === "ADMIN_PAIS";
  const centrosVisibles = filtrarPaises
    ? centros.filter((c: any) => filtrarPaises.includes(c.pais))
    : centros;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    if (esAdminPais && form.paisesAdminSel.length === 0) {
      setError("Selecciona al menos un país"); return;
    }
    if (!esVoluntario && !esAdminPais && (!form.email.trim() || !form.password.trim())) {
      setError("Email y contraseña son requeridos para este rol"); return;
    }
    if (esAdminPais && (!form.email.trim() || !form.password.trim())) {
      setError("Email y contraseña son requeridos"); return;
    }
    if (esVoluntario && (!form.nacionalidad || !form.paisResidencia || !form.ciudad || !form.edad)) {
      setError("Completa nacionalidad, país, ciudad y edad del voluntario"); return;
    }
    setLoading(true);
    try {
      await onSave({
        nombre: form.nombre,
        email: form.email || undefined,
        password: form.password || undefined,
        rol: form.rol,
        centroAcopioId: esAdminPais ? "" : form.centroAcopioId,
        paisesAdmin: esAdminPais ? form.paisesAdminSel : undefined,
        nacionalidad: form.nacionalidad || undefined,
        paisResidencia: form.paisResidencia || undefined,
        ciudad: form.ciudad || undefined,
        edad: form.edad || undefined,
        telefono: form.telefono || undefined,
      });
      onClose();
    } catch (err: any) { setError(err.message || "Error al guardar"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
        <select value={form.rol} onChange={set("rol")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3078]">
          {rolesDisponibles.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
        </select>
      </div>

      <Input label="Nombre completo *" value={form.nombre} onChange={set("nombre")} required />

      {/* Credenciales: para todos menos voluntarios */}
      {!esVoluntario && (
        <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Acceso al sistema</p>
          <Input label="Email *" type="email" value={form.email} onChange={set("email")} required />
          <PasswordField value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />
        </div>
      )}

      {/* Admin: países que administra */}
      {esAdminPais ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Países que administra * <span className="text-gray-400 font-normal">({form.paisesAdminSel.length} seleccionados)</span>
          </label>
          <PaisesMultiSelect
            value={form.paisesAdminSel}
            onChange={(v) => setForm(f => ({ ...f, paisesAdminSel: v }))}
          />
          <p className="text-xs text-gray-400 mt-1">Solo podrá crear centros y usuarios de estos países.</p>
        </div>
      ) : centroNombre ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Centro: <strong>{centroNombre}</strong>
        </p>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Centro de acopio</label>
          <select value={form.centroAcopioId} onChange={set("centroAcopioId")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3078]">
            <option value="">Seleccionar centro...</option>
            {centrosVisibles.map((c: any) => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}, {c.pais}</option>)}
          </select>
        </div>
      )}

      {/* Datos personales */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Datos personales {esVoluntario && <span className="text-gray-400 normal-case font-normal">(requeridos)</span>}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input label={`Nacionalidad${esVoluntario ? " *" : ""}`} value={form.nacionalidad} onChange={set("nacionalidad")} placeholder="Ej: Venezolana" />
          <Input label={`País de residencia${esVoluntario ? " *" : ""}`} value={form.paisResidencia} onChange={set("paisResidencia")} placeholder="Ej: Ecuador" />
          <Input label={`Ciudad${esVoluntario ? " *" : ""}`} value={form.ciudad} onChange={set("ciudad")} placeholder="Ej: Cuenca" />
          <Input label={`Edad${esVoluntario ? " *" : ""}`} type="number" value={form.edad} onChange={set("edad")} placeholder="Ej: 28" />
          <div className="col-span-2"><Input label="Teléfono (opcional)" value={form.telefono} onChange={set("telefono")} placeholder="+58 ..." /></div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>Crear usuario</Button>
      </div>
    </form>
  );
}

// ── Fila de centro con usuarios expandibles ───────────────────────
function CentroRow({ centro, onEdit, onToggle, onUserCreated, puedeGestionar = true, rolesCreables = [] }: {
  centro: any; onEdit: () => void; onToggle: () => void; onUserCreated: () => void;
  puedeGestionar?: boolean; rolesCreables?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [centroData, setCentroData] = useState<any>(null);
  const [crearUsuario, setCrearUsuario] = useState(false);
  const [loadingToggleUser, setLoadingToggleUser] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<{ id: string; nombre: string } | null>(null);
  const LOGINABLE = ["ADMIN", "COORDINADOR", "SOLO_LECTURA"];

  const loadCentro = async () => {
    if (!centroData) {
      const r = await fetch(`/api/centros/${centro.id}`);
      setCentroData(await r.json());
    }
    setExpanded(v => !v);
  };

  const toggleUser = async (uid: string, activo: boolean) => {
    setLoadingToggleUser(uid);
    await fetch(`/api/usuarios/${uid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !activo }) });
    const r = await fetch(`/api/centros/${centro.id}`);
    setCentroData(await r.json());
    setLoadingToggleUser(null);
  };

  const crearUsuarioEnCentro = async (data: any) => {
    const r = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    const r2 = await fetch(`/api/centros/${centro.id}`);
    setCentroData(await r2.json());
    onUserCreated();
  };

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        <td className="px-5 py-3">
          <Link href={`/centro/${centro.id}`} target="_blank"
            className="group inline-flex items-center gap-1.5">
            <span>
              <span className="block font-medium text-gray-900 group-hover:text-[#1B3078] group-hover:underline transition-colors">{centro.nombre}</span>
              <span className="block text-xs text-gray-400">{centro.ciudad}, {centro.pais}</span>
            </span>
            <ExternalLink size={13} className="text-gray-300 group-hover:text-[#1B3078] shrink-0 transition-colors" />
          </Link>
        </td>
        <td className="px-5 py-3 text-gray-600 text-sm">{centro.responsable}</td>
        <td className="px-5 py-3">
          {centro.usuarios?.[0]
            ? <span className="text-sm text-gray-700">{centro.usuarios[0].nombre}</span>
            : <span className="text-xs text-gray-400 italic">Sin admin</span>}
        </td>
        <td className="px-5 py-3 text-center text-sm font-medium">{centro._count.donaciones}</td>
        <td className="px-5 py-3 text-center text-sm font-medium">{centro._count.usuarios}</td>
        <td className="px-5 py-3">
          <Badge variant={centro.activo ? "success" : "danger"}>{centro.activo ? "Activo" : "Inactivo"}</Badge>
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-1">
            <button onClick={loadCentro} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Ver usuarios">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {puedeGestionar && (
              <>
                <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar"><Pencil size={15} /></button>
                <button onClick={onToggle} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Activar/Desactivar"><Power size={15} /></button>
              </>
            )}
          </div>
        </td>
      </tr>

      {expanded && centroData && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuarios de {centro.nombre}</p>
              {puedeGestionar && (
              <button onClick={() => setCrearUsuario(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#1B3078] hover:bg-[#EEF1FB] px-2.5 py-1.5 rounded-lg">
                <Plus size={13} /> Nuevo usuario
              </button>
              )}
            </div>
            {centroData.usuarios.length === 0
              ? <p className="text-sm text-gray-400">Sin usuarios aún.</p>
              : (
                <div className="space-y-1.5">
                  {centroData.usuarios.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{u.nombre}</span>
                        <span className="text-xs text-gray-400 ml-2">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ROL_BADGE[u.rol]}>{ROL_LABEL[u.rol]}</Badge>
                        {puedeGestionar && LOGINABLE.includes(u.rol) && (
                          <button
                            onClick={() => setResetUser({ id: u.id, nombre: u.nombre })}
                            className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                            Restablecer clave
                          </button>
                        )}
                        {puedeGestionar && u.rol !== "SUPERADMIN" && (
                          <button
                            onClick={() => toggleUser(u.id, u.activo)}
                            disabled={loadingToggleUser === u.id}
                            className={`text-xs px-2 py-1 rounded font-medium ${u.activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            {crearUsuario && (
              <Modal title={`Nuevo usuario — ${centro.nombre}`} onClose={() => setCrearUsuario(false)}>
                <UsuarioForm
                  centroId={centro.id} centroNombre={centro.nombre}
                  rolesDisponibles={rolesCreables.length ? rolesCreables : ["ADMIN", "COORDINADOR", "VOLUNTARIO"]}
                  onSave={crearUsuarioEnCentro} onClose={() => setCrearUsuario(false)}
                />
              </Modal>
            )}
            {resetUser && (
              <ResetPasswordModal userId={resetUser.id} userName={resetUser.nombre} onClose={() => setResetUser(null)} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [centros, setCentros] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalCentro, setModalCentro] = useState<"create" | "edit" | null>(null);
  const [centroEditando, setCentroEditando] = useState<any>(null);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [resetUserG, setResetUserG] = useState<{ id: string; nombre: string } | null>(null);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [filtroUsuarios, setFiltroUsuarios] = useState("");
  const [centroPage, setCentroPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const rol = session?.user?.rol;
  const soySuper = esSuperAdmin(rol);
  const misPaises = session?.user?.paisesAdmin || [];
  const rolesCreables = rolesQuePuedeCrear(rol);
  // ¿puede gestionar (editar/desactivar) este centro?
  const puedeGestionarCentro = (c: any) => soySuper || misPaises.includes(c.pais);
  // ¿puede gestionar (reset/desactivar) este usuario?
  const puedeGestionarUsuario = (u: any) => {
    if (u.rol === "SUPERADMIN") return false;
    if (soySuper) return true;
    if (u.rol === "ADMIN_PAIS") return false; // admin de país no toca otros admins
    return misPaises.includes(u.centroAcopio?.pais);
  };
  const LOGINABLE_G = ["ADMIN_PAIS", "ADMIN", "COORDINADOR", "SOLO_LECTURA"];

  useEffect(() => {
    if (status === "authenticated" && !puedePortalAdmin(session.user.rol)) router.replace("/dashboard");
  }, [session, status, router]);

  const load = () => {
    Promise.all([
      fetch("/api/centros").then(r => r.json()),
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/usuarios").then(r => r.json()),
    ]).then(([c, d, u]) => {
      if (Array.isArray(c)) setCentros(c);
      setDashData(d);
      if (Array.isArray(u)) setUsuarios(u);
      setLoading(false);
    });
  };

  const toggleUsuarioGlobal = async (id: string, activo: boolean) => {
    setTogglingUser(id);
    await fetch(`/api/usuarios/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    await load();
    setTogglingUser(null);
  };

  useEffect(() => { load(); }, []);

  if (loading || status === "loading") return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
    </div>
  );

  const crearCentro = async (data: any) => {
    const payload = {
      ...data,
      latitud:  data.latitud  != null ? Number(data.latitud)  : undefined,
      longitud: data.longitud != null ? Number(data.longitud) : undefined,
    };
    const r = await fetch("/api/centros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    const centro = await r.json();
    load();
    return centro;
  };

  const editarCentro = async (data: any) => {
    const payload = {
      ...data,
      latitud:  data.latitud  != null ? Number(data.latitud)  : undefined,
      longitud: data.longitud != null ? Number(data.longitud) : undefined,
    };
    const r = await fetch(`/api/centros/${centroEditando.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    load();
    return centroEditando;
  };

  const toggleCentro = async (c: any) => {
    await fetch(`/api/centros/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !c.activo }) });
    load();
  };

  const crearUsuarioGlobal = async (data: any) => {
    const r = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    load();
  };

  // ── Paginación de las tablas (20 por página) ──
  const centrosPages = Math.max(1, Math.ceil(centros.length / PER_PAGE));
  const cPage = Math.min(centroPage, centrosPages);
  const centrosPaginados = centros.slice((cPage - 1) * PER_PAGE, cPage * PER_PAGE);

  const usuariosFiltrados = usuarios.filter((u: any) => {
    const q = filtroUsuarios.trim().toLowerCase();
    if (!q) return true;
    return (u.nombre || "").toLowerCase().includes(q)
      || (u.email || "").toLowerCase().includes(q)
      || (ROL_LABEL[u.rol] || "").toLowerCase().includes(q);
  });
  const usuariosPages = Math.max(1, Math.ceil(usuariosFiltrados.length / PER_PAGE));
  const uPage = Math.min(userPage, usuariosPages);
  const usuariosPaginados = usuariosFiltrados.slice((uPage - 1) * PER_PAGE, uPage * PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
            <Shield size={20} className="text-[#1B3078]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {soySuper ? "Portal SuperAdmin" : "Portal de Administración"}
            </h1>
            <p className="text-gray-500 text-sm">
              {soySuper ? "Control global de todos los centros" : `Administras: ${misPaises.join(", ") || "—"}`}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setModalUsuario(true)}>
            <Users size={15} className="mr-1.5" /> Nuevo usuario
          </Button>
          <Button onClick={() => { setCentroEditando(null); setModalCentro("create"); }}>
            <Plus size={15} className="mr-1.5" /> Nuevo centro
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      {dashData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Centros Activos",  value: dashData.totalCentros,    color: "bg-gray-100 text-gray-500", icon: Building2 },
            { label: "Total Donaciones", value: dashData.totalDonaciones,  color: "bg-gray-100 text-gray-500", icon: Shield },
            { label: "Voluntarios",      value: dashData.totalUsuarios,    color: "bg-gray-100 text-gray-500", icon: Users },
            { label: "Items Totales",    value: dashData.totalItems,       color: "bg-gray-100 text-gray-500", icon: Building2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-full p-2.5 ${color}`}><Icon size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Centros */}
      <Card>
        <CardHeader>
          <CardTitle>Centros de Acopio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Centro", "Responsable", "Admin asignado", "Donaciones", "Usuarios", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centros.length === 0
                  ? <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No hay centros aún</td></tr>
                  : centrosPaginados.map(c => (
                    <CentroRow
                      key={c.id} centro={c}
                      puedeGestionar={puedeGestionarCentro(c)}
                      rolesCreables={rolesCreables.filter(r => r !== "ADMIN_PAIS")}
                      onEdit={() => { setCentroEditando(c); setModalCentro("edit"); }}
                      onToggle={() => toggleCentro(c)}
                      onUserCreated={load}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={cPage} pages={centrosPages} total={centros.length} perPage={PER_PAGE}
            onChange={setCentroPage} label="centros" />
        </CardContent>
      </Card>

      {/* Todos los usuarios */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Todos los usuarios ({usuarios.length})</CardTitle>
            <div className="relative sm:w-64">
              <input
                type="text" placeholder="Buscar por nombre, email o rol..."
                value={filtroUsuarios} onChange={e => { setFiltroUsuarios(e.target.value); setUserPage(1); }}
                className="w-full text-sm border border-gray-200 rounded-lg pl-3 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nombre", "Email", "Rol", "Centro / Países", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosPaginados
                  .map((u: any) => (
                    <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{u.nombre}</td>
                      <td className="px-5 py-3 text-gray-500">{u.email || "—"}</td>
                      <td className="px-5 py-3"><Badge variant={ROL_BADGE[u.rol]}>{ROL_LABEL[u.rol]}</Badge></td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        {u.rol === "ADMIN_PAIS"
                          ? (u.paisesAdmin?.join(", ") || "—")
                          : u.centroAcopio
                            ? `${u.centroAcopio.nombre} (${u.centroAcopio.pais})`
                            : "—"}
                      </td>
                      <td className="px-5 py-3"><Badge variant={u.activo ? "success" : "default"}>{u.activo ? "Activo" : "Inactivo"}</Badge></td>
                      <td className="px-5 py-3">
                        {puedeGestionarUsuario(u) && (
                          <div className="flex items-center gap-1.5">
                            {LOGINABLE_G.includes(u.rol) && (
                              <button onClick={() => setResetUserG({ id: u.id, nombre: u.nombre })}
                                className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                                Restablecer clave
                              </button>
                            )}
                            <button onClick={() => toggleUsuarioGlobal(u.id, u.activo)} disabled={togglingUser === u.id}
                              className={`text-xs px-2 py-1 rounded font-medium ${u.activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                              {u.activo ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                {usuariosFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    {filtroUsuarios ? "Sin usuarios que coincidan con la búsqueda" : "No hay usuarios aún"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={uPage} pages={usuariosPages} total={usuariosFiltrados.length} perPage={PER_PAGE}
            onChange={setUserPage} label="usuarios" />
        </CardContent>
      </Card>

      {/* Modals */}
      {resetUserG && (
        <ResetPasswordModal userId={resetUserG.id} userName={resetUserG.nombre} onClose={() => setResetUserG(null)} />
      )}
      {modalCentro === "create" && (
        <Modal title="Nuevo Centro de Acopio" onClose={() => setModalCentro(null)} wide>
          <CentroForm onSave={crearCentro} onClose={() => setModalCentro(null)} esSuper={soySuper} paisesAdmin={misPaises} />
        </Modal>
      )}
      {modalCentro === "edit" && centroEditando && (
        <Modal title={`Editar — ${centroEditando.nombre}`} onClose={() => setModalCentro(null)} wide>
          <CentroForm initial={centroEditando} onSave={editarCentro} onClose={() => setModalCentro(null)} esSuper={soySuper} paisesAdmin={misPaises} />
        </Modal>
      )}
      {modalUsuario && (
        <Modal title="Nuevo Usuario" onClose={() => setModalUsuario(false)}>
          <UsuarioForm
            rolesDisponibles={rolesCreables}
            filtrarPaises={soySuper ? null : misPaises}
            onSave={crearUsuarioGlobal} onClose={() => setModalUsuario(false)}
          />
        </Modal>
      )}
    </div>
  );
}
