"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Plus, X, MapPin, Phone, Mail, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ROL_LABEL, ROL_BADGE, esResponsable, rolesQuePuedeCrear } from "@/lib/permisos";
import { PasswordField, ResetPasswordModal } from "@/components/password-field";

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";

interface Usuario {
  id: string; nombre: string; email?: string | null; rol: string; activo: boolean; creadoEn: string;
  nacionalidad?: string | null; paisResidencia?: string | null; ciudad?: string | null;
  edad?: number | null; telefono?: string | null;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Formulario de usuario ───────────────────────────────────────────────────────
function NuevoUsuarioForm({ rolesDisponibles, onSave, onClose }: {
  rolesDisponibles: string[];
  onSave: (d: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", rol: rolesDisponibles[0] || "VOLUNTARIO",
    nacionalidad: "", paisResidencia: "", ciudad: "", edad: "", telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const esVoluntario = form.rol === "VOLUNTARIO";

  return (
    <form onSubmit={async e => {
      e.preventDefault(); setError("");
      // Validación mínima
      if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
      if (!esVoluntario && (!form.email.trim() || !form.password.trim())) {
        setError("Email y contraseña son requeridos para este rol"); return;
      }
      if (esVoluntario && (!form.nacionalidad || !form.paisResidencia || !form.ciudad || !form.edad)) {
        setError("Completa nacionalidad, país, ciudad y edad del voluntario"); return;
      }
      setLoading(true);
      try { await onSave(form); onClose(); }
      catch (err: any) { setError(err.message || "Error al crear usuario"); }
      finally { setLoading(false); }
    }} className="space-y-4">

      {/* Rol */}
      {rolesDisponibles.length > 1 ? (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
          <select value={form.rol} onChange={set("rol")} className={inputCls + " bg-white"}>
            {rolesDisponibles.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </select>
        </div>
      ) : (
        <div className="bg-[#EEF1FB] rounded-lg px-3 py-2 text-sm text-[#1B3078] font-medium flex items-center gap-2">
          <Users size={14} /> Nuevo {ROL_LABEL[form.rol].toLowerCase()}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
        <input value={form.nombre} onChange={set("nombre")} className={inputCls} required />
      </div>

      {/* Credenciales solo para roles con acceso */}
      {!esVoluntario && (
        <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Acceso al sistema</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
          </div>
          <PasswordField value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />
          <p className="text-[11px] text-gray-400">Comparte esta contraseña con la persona. Si la olvida, podrás restablecerla.</p>
        </div>
      )}

      {/* Datos personales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Datos personales {esVoluntario && <span className="text-gray-400 normal-case font-normal">(requeridos)</span>}
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad {esVoluntario && "*"}</label>
          <input value={form.nacionalidad} onChange={set("nacionalidad")} placeholder="Ej: Venezolana" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">País de residencia {esVoluntario && "*"}</label>
          <input value={form.paisResidencia} onChange={set("paisResidencia")} placeholder="Ej: Ecuador" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad {esVoluntario && "*"}</label>
          <input value={form.ciudad} onChange={set("ciudad")} placeholder="Ej: Cuenca" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Edad {esVoluntario && "*"}</label>
          <input type="number" min="0" max="120" value={form.edad} onChange={set("edad")} placeholder="Ej: 28" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono <span className="text-gray-400">(opcional)</span></label>
          <input value={form.telefono} onChange={set("telefono")} placeholder="+58 ..." className={inputCls} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>Crear</Button>
      </div>
    </form>
  );
}

// ── Tabla de voluntarios ─────────────────────────────────────────────────────────
function TablaVoluntarios({ voluntarios, onToggle, togglingId, puedeGestionar }: {
  voluntarios: Usuario[]; onToggle: (id: string, activo: boolean) => void;
  togglingId: string | null; puedeGestionar: boolean;
}) {
  if (voluntarios.length === 0) {
    return <div className="px-5 py-8 text-center text-gray-400 text-sm">No hay voluntarios registrados aún.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["Nombre", "Nacionalidad", "Residencia", "Edad", "Teléfono", "Estado", ""].map(h => (
              <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {voluntarios.map(u => (
            <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
              <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{u.nombre}</td>
              <td className="px-5 py-3 text-gray-600">{u.nacionalidad || "—"}</td>
              <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                {[u.ciudad, u.paisResidencia].filter(Boolean).join(", ") || "—"}
              </td>
              <td className="px-5 py-3 text-gray-600">{u.edad ?? "—"}</td>
              <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{u.telefono || "—"}</td>
              <td className="px-5 py-3">
                <Badge variant={u.activo ? "success" : "default"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
              </td>
              <td className="px-5 py-3">
                {puedeGestionar && (
                  <button onClick={() => onToggle(u.id, u.activo)} disabled={togglingId === u.id}
                    className={`text-xs px-2 py-1 rounded font-medium ${u.activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                    {u.activo ? "Desactivar" : "Reactivar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────────
export default function MiCentroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const rol = session?.user?.rol;
  const responsable = esResponsable(rol);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [centro, setCentro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<{ id: string; nombre: string } | null>(null);

  const loadUsuarios = () =>
    fetch("/api/usuarios").then(r => r.json()).then(d => { if (Array.isArray(d)) setUsuarios(d); });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/login"); return; }
    const r = session!.user.rol;
    if (r !== "ADMIN" && r !== "COORDINADOR") { router.replace("/dashboard"); return; }

    const tasks: Promise<any>[] = [loadUsuarios()];
    // Solo el responsable carga la info/contadores del centro
    if (r === "ADMIN" && session!.user.centroAcopioId) {
      tasks.push(
        fetch(`/api/centros/${session!.user.centroAcopioId}`).then(x => x.json()).then(setCentro)
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [status]); // eslint-disable-line

  const crearUsuario = async (data: any) => {
    const r = await fetch("/api/usuarios", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    loadUsuarios();
  };

  const toggleUsuario = async (id: string, activo: boolean) => {
    setTogglingId(id);
    await fetch(`/api/usuarios/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    await loadUsuarios();
    setTogglingId(null);
  };

  if (loading || status === "loading") return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
    </div>
  );

  const coordinadores = usuarios.filter(u => u.rol === "COORDINADOR");
  const voluntarios   = usuarios.filter(u => u.rol === "VOLUNTARIO");
  const rolesDisponibles = rolesQuePuedeCrear(rol);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
            <Settings size={20} className="text-[#1B3078]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Centro</h1>
            <p className="text-gray-500 text-sm">
              {session?.user?.centrNombre || ""} — {responsable ? "Gestión de usuarios" : "Voluntarios"}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <Button onClick={() => setModalUsuario(true)}>
            <Plus size={15} className="mr-1.5" /> {responsable ? "Nuevo usuario" : "Nuevo voluntario"}
          </Button>
        </div>
      </div>

      {/* Info del centro — solo responsable */}
      {responsable && centro && (
        <Card>
          <CardHeader><CardTitle>Información del Centro</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#00A8E8] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Ubicación</p>
                  <p className="text-sm font-medium text-gray-800">{centro.ciudad}, {centro.pais}</p>
                  {centro.direccion && <p className="text-xs text-gray-500">{centro.direccion}</p>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={15} className="text-[#00A8E8] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Responsable</p>
                  <p className="text-sm font-medium text-gray-800">{centro.responsable}</p>
                </div>
              </div>
              {centro.telefono && (
                <div className="flex items-start gap-2">
                  <Phone size={15} className="text-[#00A8E8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Teléfono</p>
                    <p className="text-sm font-medium text-gray-800">{centro.telefono}</p>
                  </div>
                </div>
              )}
              {centro.email && (
                <div className="flex items-start gap-2">
                  <Mail size={15} className="text-[#00A8E8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-gray-800">{centro.email}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              {[
                { label: "Donaciones", value: centro._count?.donaciones ?? 0 },
                { label: "Envíos", value: centro._count?.envios ?? 0 },
                { label: "Consumos", value: centro._count?.consumos ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-[#1B3078]">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipo (coordinadores) — solo responsable */}
      {responsable && (
        <Card>
          <CardHeader><CardTitle>Equipo del centro ({coordinadores.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {coordinadores.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No hay coordinadores aún.{" "}
                <button onClick={() => setModalUsuario(true)} className="text-[#1B3078] font-medium hover:underline">Agregar</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Nombre", "Email", "Rol", "Desde", "Estado", ""].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {coordinadores.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{u.nombre}</td>
                        <td className="px-5 py-3 text-gray-500">{u.email || "—"}</td>
                        <td className="px-5 py-3"><Badge variant={ROL_BADGE[u.rol]}>{ROL_LABEL[u.rol]}</Badge></td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.creadoEn)}</td>
                        <td className="px-5 py-3"><Badge variant={u.activo ? "success" : "default"}>{u.activo ? "Activo" : "Inactivo"}</Badge></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setResetUser({ id: u.id, nombre: u.nombre })}
                              className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                              Restablecer clave
                            </button>
                            <button onClick={() => toggleUsuario(u.id, u.activo)} disabled={togglingId === u.id}
                              className={`text-xs px-2 py-1 rounded font-medium ${u.activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                              {u.activo ? "Desactivar" : "Reactivar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voluntarios — responsable y coordinador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={16} className="text-[#1B3078]" /> Voluntarios ({voluntarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TablaVoluntarios
            voluntarios={voluntarios}
            onToggle={toggleUsuario}
            togglingId={togglingId}
            puedeGestionar={true}
          />
        </CardContent>
      </Card>

      {modalUsuario && (
        <Modal title={responsable ? "Nuevo usuario" : "Nuevo voluntario"} onClose={() => setModalUsuario(false)}>
          <NuevoUsuarioForm
            rolesDisponibles={rolesDisponibles}
            onSave={crearUsuario}
            onClose={() => setModalUsuario(false)}
          />
        </Modal>
      )}

      {resetUser && (
        <ResetPasswordModal userId={resetUser.id} userName={resetUser.nombre} onClose={() => setResetUser(null)} />
      )}
    </div>
  );
}
