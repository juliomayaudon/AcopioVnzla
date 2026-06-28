"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle2, Loader2 } from "lucide-react";

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

interface Centro { id: string; nombre: string; ciudad: string; pais: string }

export default function RegistrarVoluntarioPage() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [form, setForm] = useState({ centroAcopioId: "", nombre: "", telefono: "", email: "", nacionalidad: "", paisResidencia: "", ciudad: "", edad: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/api/public/centros").then(r => r.json()).then(d => { if (Array.isArray(d)) setCentros(d); });
  }, []);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.centroAcopioId) { setError("Selecciona el centro al que quieres unirte"); return; }
    if (!form.nombre || !form.telefono) { setError("Completa tu nombre y teléfono"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/registro/voluntario", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No se pudo completar el registro"); return; }
      setOk(true);
    } catch { setError("No se pudo conectar. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  if (ok) {
    const centro = centros.find(c => c.id === form.centroAcopioId);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por unirte!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Quedaste registrado como voluntario {centro ? <>en <strong>{centro.nombre}</strong></> : ""}.
            El equipo del centro te contactará al número que dejaste.
          </p>
          <Link href="/" className="inline-block w-full bg-[#1B3078] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#142360] transition-colors">
            Volver al inicio
          </Link>
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

      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#EEF1FB] flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-[#1B3078]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Únete como voluntario</h1>
          <p className="text-gray-500 text-sm mt-1">Regístrate y el centro que elijas te contactará.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className={labelCls}>Centro al que te quieres unir *</label>
            <select className={inputCls + " bg-white"} value={form.centroAcopioId} onChange={set("centroAcopioId")} required>
              <option value="">Seleccionar centro...</option>
              {centros.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}, {c.pais}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={labelCls}>Nombre completo *</label><input className={inputCls} value={form.nombre} onChange={set("nombre")} required /></div>
            <div><label className={labelCls}>Teléfono *</label><input className={inputCls} value={form.telefono} onChange={set("telefono")} placeholder="+58 ..." required /></div>
            <div><label className={labelCls}>Email <span className="text-gray-400">(opcional)</span></label><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></div>
            <div><label className={labelCls}>Nacionalidad</label><input className={inputCls} value={form.nacionalidad} onChange={set("nacionalidad")} placeholder="Ej: Venezolana" /></div>
            <div><label className={labelCls}>País de residencia</label><input className={inputCls} value={form.paisResidencia} onChange={set("paisResidencia")} /></div>
            <div><label className={labelCls}>Ciudad</label><input className={inputCls} value={form.ciudad} onChange={set("ciudad")} /></div>
            <div><label className={labelCls}>Edad</label><input type="number" min="0" className={inputCls} value={form.edad} onChange={set("edad")} /></div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1B3078] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#142360] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Registrarme como voluntario
          </button>
        </form>
      </div>
    </div>
  );
}
