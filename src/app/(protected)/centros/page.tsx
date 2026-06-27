"use client";
import { useEffect, useState, useMemo } from "react";
import { Building2, MapPin, Phone, Mail, Users, Package, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Centro {
  id: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion?: string;
  responsable: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  bannerUrl?: string;
  activo: boolean;
  _count: { donaciones: number; usuarios: number };
}

export default function CentrosPage() {
  const [centros, setCentros]   = useState<Centro[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPais, setFiltroPais] = useState("todos");

  useEffect(() => {
    fetch("/api/centros")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCentros(data); })
      .finally(() => setLoading(false));
  }, []);

  const paises = useMemo(() =>
    ["todos", ...Array.from(new Set(centros.map(c => c.pais))).sort()], [centros]);

  const filtrados = useMemo(() => centros.filter(c => {
    if (filtroPais !== "todos" && c.pais !== filtroPais) return false;
    if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !c.ciudad.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [centros, busqueda, filtroPais]);

  const activos = centros.filter(c => c.activo).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Red de Centros de Acopio</h1>
        <p className="text-gray-500 text-sm mt-1">
          {activos} centro{activos !== 1 ? "s" : ""} activo{activos !== 1 ? "s" : ""} en {paises.length - 1} país{paises.length - 1 !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]"
          />
        </div>
        <select
          value={filtroPais}
          onChange={e => setFiltroPais(e.target.value)}
          className="shrink-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078] bg-white text-gray-700"
        >
          {paises.map(p => (
            <option key={p} value={p}>{p === "todos" ? "Todos los países" : p}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Building2 size={40} className="opacity-30" />
          <p className="text-sm">No hay centros que coincidan con la búsqueda</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Mostrando {filtrados.length} de {centros.length} centros
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtrados.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                {/* Banner */}
                <div className="h-32 relative overflow-hidden">
                  {c.bannerUrl
                    ? <img src={c.bannerUrl} alt={c.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1B3078 0%, #1e3a8a 100%)" }} />
                  }
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(27,48,120,0.7) 0%, transparent 55%)" }} />
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${c.activo ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                  <p className="absolute bottom-3 left-4 text-white font-bold text-base leading-tight">{c.nombre}</p>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-1.5 text-sm text-gray-500">
                    <MapPin size={13} className="shrink-0 mt-0.5 text-gray-400" />
                    <div>
                      <span>{c.ciudad}, {c.pais}</span>
                      {c.direccion && <p className="text-xs text-gray-400 mt-0.5">{c.direccion}</p>}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-800">{c.responsable}</p>
                    {c.telefono && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Phone size={12} className="text-gray-400" /> {c.telefono}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Mail size={12} className="text-gray-400" /> {c.email}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Package size={14} className="text-[#1B3078]" />
                      <span className="font-bold text-gray-800">{c._count.donaciones}</span>
                      <span className="text-gray-400 text-xs">donaciones</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-[#00A8E8]" />
                      <span className="font-bold text-gray-800">{c._count.usuarios}</span>
                      <span className="text-gray-400 text-xs">voluntarios</span>
                    </div>
                    <Link href={`/centro/${c.id}`} target="_blank"
                      className="ml-auto flex items-center gap-1 text-xs text-[#00A8E8] font-medium hover:underline shrink-0">
                      Ver página <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
