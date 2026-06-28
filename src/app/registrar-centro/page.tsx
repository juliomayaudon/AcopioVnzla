"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, User, MapPin, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { PAISES } from "@/lib/paises";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[338px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  ),
});

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

export default function RegistrarCentroPage() {
  const router = useRouter();
  const [resp, setResp] = useState({ nombre: "", email: "", password: "", nacionalidad: "", paisResidencia: "", ciudad: "", edad: "", telefono: "" });
  const [centro, setCentro] = useState({ nombre: "", pais: "", ciudad: "", direccion: "", whatsapp: "", latitud: null as number | null, longitud: null as number | null });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const setR = (k: string) => (e: any) => setResp(f => ({ ...f, [k]: e.target.value }));
  const setC = (k: string) => (e: any) => setCentro(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!resp.nombre || !resp.email || !resp.password) { setError("Completa tu nombre, email y contraseña"); return; }
    if (resp.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (!centro.nombre || !centro.pais || !centro.ciudad) { setError("Completa nombre, país y ciudad del centro"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/registro/centro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsable: resp, centro }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No se pudo registrar el centro"); return; }
      setOk(true);
    } catch { setError("No se pudo conectar. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  if (ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Centro registrado!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Tu centro ya está activo y eres su responsable. Inicia sesión con tu email y contraseña para
            gestionarlo y registrar coordinadores y voluntarios.
          </p>
          <button onClick={() => router.push("/login")}
            className="w-full bg-[#1B3078] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#142360] transition-colors">
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 h-14 flex items-center px-5 gap-4 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#1B3078] text-sm font-medium">
          <ArrowLeft size={16} /> Inicio
        </Link>
        <img src="/Operacion_transparente.svg" alt="Operación Todos con Venezuela" className="h-8 ml-auto" />
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#EEF1FB] flex items-center justify-center mx-auto mb-3">
            <Building2 size={24} className="text-[#1B3078]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Registra tu centro de acopio</h1>
          <p className="text-gray-500 text-sm mt-1">Quedarás como responsable y podrás gestionarlo de inmediato.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Responsable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={16} className="text-[#1B3078]" /> Tus datos (responsable)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={labelCls}>Nombre completo *</label><input className={inputCls} value={resp.nombre} onChange={setR("nombre")} required /></div>
              <div><label className={labelCls}>Email *</label><input type="email" className={inputCls} value={resp.email} onChange={setR("email")} required /></div>
              <div>
                <label className={labelCls}>Contraseña *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} className={inputCls + " pr-9"} value={resp.password} onChange={setR("password")} placeholder="Mínimo 6 caracteres" required />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div><label className={labelCls}>Nacionalidad</label><input className={inputCls} value={resp.nacionalidad} onChange={setR("nacionalidad")} placeholder="Ej: Venezolana" /></div>
              <div><label className={labelCls}>País de residencia</label><input className={inputCls} value={resp.paisResidencia} onChange={setR("paisResidencia")} /></div>
              <div><label className={labelCls}>Edad</label><input type="number" min="0" className={inputCls} value={resp.edad} onChange={setR("edad")} /></div>
              <div><label className={labelCls}>Teléfono</label><input className={inputCls} value={resp.telefono} onChange={setR("telefono")} placeholder="+58 ..." /></div>
            </div>
          </div>

          {/* Centro */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-[#1B3078]" /> Datos del centro
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={labelCls}>Nombre del centro *</label><input className={inputCls} value={centro.nombre} onChange={setC("nombre")} required /></div>
              <div>
                <label className={labelCls}>País *</label>
                <select className={inputCls + " bg-white"} value={centro.pais} onChange={setC("pais")} required>
                  <option value="">Seleccionar país...</option>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Ciudad *</label><input className={inputCls} value={centro.ciudad} onChange={setC("ciudad")} required /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Dirección</label><input className={inputCls} value={centro.direccion} onChange={setC("direccion")} /></div>
              <div className="sm:col-span-2">
                <label className={labelCls}>WhatsApp de contacto (con código de país)</label>
                <input className={inputCls} value={centro.whatsapp} onChange={setC("whatsapp")} placeholder="+58 424 123 4567" />
                <p className="text-[11px] text-gray-400 mt-1">Aquí te contactarán los voluntarios desde la web pública.</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Ubicación en el mapa <span className="text-gray-400">— busca una dirección o haz clic en el mapa</span></label>
              <LocationPicker
                initialLat={centro.latitud} initialLng={centro.longitud}
                onPick={(lat: number, lng: number) => setCentro(f => ({ ...f, latitud: lat, longitud: lng }))}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1B3078] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#142360] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Registrar centro
          </button>
          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta? <Link href="/login" className="text-[#00A8E8] font-semibold hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
