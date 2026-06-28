"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Package, Users, Heart, ArrowRight, ExternalLink, Search, Globe, MessageCircle } from "lucide-react";
import type { CentroMapa } from "@/components/map-view";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078] mx-auto" />
    </div>
  ),
});

// Formato compacto: 523 · 1.45K · 50.2K · 1.45M
function formatCompacto(n: number): string {
  const fmt = (v: number, unit: string) => {
    const d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    let s = v.toFixed(d);
    if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s + unit;
  };
  if (n >= 1e6) return fmt(n / 1e6, "M");
  if (n >= 1e3) return fmt(n / 1e3, "K");
  return Math.round(n).toString();
}

function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || target === 0) { setVal(target); return; }
    done.current = true;
    const steps = 60; const duration = 1800;
    const inc = target / steps; let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [target]);
  return <span>{formatCompacto(val)}</span>;
}

interface Centro {
  id: string; nombre: string; ciudad: string; pais: string;
  direccion?: string; latitud?: number; longitud?: number;
  responsable: string; whatsapp?: string; bannerUrl?: string; activo: boolean;
  _count: { donaciones: number; usuarios: number };
}

function waUrl(n: string) { return `https://wa.me/${n.replace(/\D/g, "")}`; }

export default function HomePage() {
  const [stats, setStats]       = useState({ centros: 0, donaciones: 0, usuarios: 0, items: 0 });
  const [centros, setCentros]   = useState<Centro[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [dataLoaded, setDataLoaded]   = useState(false);
  const [filtroPais, setFiltroPais]   = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState<"todos"|"activo"|"inactivo">("todos");
  const [busqueda, setBusqueda]       = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/public/centros?activos=false").then(r => r.json()),
    ]).then(([s, c]) => {
      setStats(s); setStatsLoaded(true);
      if (Array.isArray(c)) setCentros(c);
      setDataLoaded(true);
    });
    const iv = setInterval(() =>
      fetch("/api/stats").then(r => r.json()).then(setStats), 30000);
    return () => clearInterval(iv);
  }, []);

  const paises = useMemo(() =>
    ["todos", ...Array.from(new Set(centros.map(c => c.pais))).sort()], [centros]);

  const centrosFiltrados = useMemo(() => centros.filter(c => {
    if (filtroPais !== "todos" && c.pais !== filtroPais) return false;
    if (filtroEstado === "activo" && !c.activo) return false;
    if (filtroEstado === "inactivo" && c.activo) return false;
    if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !c.ciudad.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [centros, filtroPais, filtroEstado, busqueda]);

  const centrosConCoords = useMemo(() =>
    centrosFiltrados.filter(c => c.latitud != null && c.longitud != null) as CentroMapa[], [centrosFiltrados]);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 h-14 flex items-center px-6 lg:px-12">
        <span className="text-xl font-bold text-[#1B3078] tracking-tight">
          Acopio<span className="text-[#00A8E8]"> Venezuela</span>
        </span>
        <div className="ml-auto flex items-center gap-6">
          <Link href="/como-funciona" className="hidden sm:block text-sm text-gray-600 hover:text-[#1B3078] font-medium">¿Cómo funciona?</Link>
          <a href="#centros" className="hidden sm:block text-sm text-gray-600 hover:text-[#1B3078] font-medium">Centros</a>
          <a href="#mapa"    className="hidden sm:block text-sm text-gray-600 hover:text-[#1B3078] font-medium">Mapa</a>
          <Link href="/registrar-centro" className="hidden sm:block text-sm text-gray-600 hover:text-[#1B3078] font-medium">Registra tu centro</Link>
          <Link href="/login" className="bg-[#1B3078] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#142360] transition-colors">
            Ingresar al sistema
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 pb-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f1f5c 0%, #1B3078 50%, #1e3a8a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00A8E8 0%, transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00A8E8 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="mx-auto mb-8 text-5xl sm:text-6xl font-bold text-white tracking-tight">
            Acopio<span className="text-[#00A8E8]"> Venezuela</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-[#00A8E8] animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-wide uppercase">
              Datos en tiempo real · Actualizado cada 30s
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Unidos por <span className="text-[#00A8E8]">Venezuela</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Red global de centros de acopio humanitario. Transparencia total —
            cada donación registrada, cada envío trazado.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: MapPin,  label: "Centros activos",     value: stats.centros    },
              { icon: Heart,   label: "Donaciones recibidas",value: stats.donaciones  },
              { icon: Package, label: "Items recolectados",  value: stats.items       },
              { icon: Users,   label: "Voluntarios activos", value: stats.usuarios    },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
                <Icon size={20} className="mx-auto mb-2 text-white/70" />
                <p className="text-3xl font-bold text-white">
                  {statsLoaded ? <Counter target={value} /> : "—"}
                </p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/registrar-centro" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00A8E8] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0090C8] transition-colors">
              Registra tu centro <ArrowRight size={16} />
            </Link>
            <Link href="/registrar-voluntario" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#1B3078] font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
              Únete como voluntario <Users size={16} />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mt-3">
            <Link href="/como-funciona" className="inline-flex items-center justify-center gap-2 text-white/80 font-medium px-4 py-2 rounded-xl hover:text-white transition-colors text-sm">
              ¿Cómo funciona? <ArrowRight size={15} />
            </Link>
            <a href="#centros" className="inline-flex items-center justify-center gap-2 text-white/80 font-medium px-4 py-2 rounded-xl hover:text-white transition-colors text-sm">
              Ver centros <ArrowRight size={15} />
            </a>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 text-white/80 font-medium px-4 py-2 rounded-xl hover:text-white transition-colors text-sm">
              Acceder al sistema <ExternalLink size={15} />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 20C1200 70 960 0 720 40C480 80 240 10 0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Mapa ── */}
      <section id="mapa" className="py-16 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#00A8E8] text-sm font-bold uppercase tracking-widest">Cobertura mundial</span>
            <h2 className="text-3xl font-bold text-[#1B3078] mt-2">Centros en el mundo</h2>
            <p className="text-gray-500 mt-2">
              {centros.filter(c=>c.activo).length} centro{centros.filter(c=>c.activo).length !== 1 ? "s" : ""} activo{centros.filter(c=>c.activo).length !== 1 ? "s" : ""} en {paises.length - 1} país{paises.length - 1 !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ height: 480 }}>
            {centrosConCoords.length > 0
              ? <MapView centros={centrosConCoords} />
              : dataLoaded
                ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
                    <Globe size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      Aún no hay centros con coordenadas registradas
                    </p>
                  </div>
                )
                : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
                  </div>
                )
            }
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            El número en cada marcador indica las donaciones. Haz clic para ver más información.
          </p>
        </div>
      </section>

      {/* ── Centros ── */}
      <section id="centros" className="py-16 px-6 lg:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[#00A8E8] text-sm font-bold uppercase tracking-widest">Red de apoyo</span>
            <h2 className="text-3xl font-bold text-[#1B3078] mt-2">Centros de Acopio</h2>
            <p className="text-gray-500 mt-2">Cada centro recibe, organiza y envía ayuda a Venezuela</p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Buscar por nombre o ciudad..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]"
              />
            </div>

            {/* Estado */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
              {(["todos","activo","inactivo"] as const).map(e => (
                <button key={e} onClick={() => setFiltroEstado(e)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    filtroEstado === e
                      ? "bg-[#1B3078] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}>
                  {e === "todos" ? "Todos" : e === "activo" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>

            {/* País */}
            <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)}
              className="shrink-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078] bg-white text-gray-700">
              {paises.map(p => (
                <option key={p} value={p}>
                  {p === "todos" ? "Todos los países" : p}
                </option>
              ))}
            </select>
          </div>

          {/* Resultados */}
          {centrosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={40} className="mx-auto mb-4 opacity-40" />
              <p>No hay centros que coincidan con los filtros</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">
                Mostrando {centrosFiltrados.length} de {centros.length} centros
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {centrosFiltrados.map((c) => (
                  <div key={c.id}
                    className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">

                    {/* Overlay que hace clicable toda la tarjeta hacia la página del centro */}
                    <Link href={`/centro/${c.id}`} aria-label={`Ver ${c.nombre}`} className="absolute inset-0 z-[1]" />

                    {/* Banner o placeholder */}
                    <div className="h-36 relative overflow-hidden">
                      {c.bannerUrl
                        ? <img src={c.bannerUrl} alt={c.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                            style={{ background: "linear-gradient(135deg, #1B3078 0%, #1e3a8a 100%)" }}>
                            <MapPin size={28} className="text-white/40" />
                            <span className="text-white/50 text-xs font-medium">{c.pais}</span>
                          </div>
                        )
                      }
                      {/* Badge estado */}
                      <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        c.activo ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-[#1B3078] transition-colors">
                        {c.nombre}
                      </h3>
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <MapPin size={13} className="shrink-0 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-600 text-sm leading-snug">{c.ciudad}, {c.pais}</p>
                          {c.direccion && (
                            <p className="text-gray-400 text-xs mt-0.5 leading-snug">{c.direccion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-lg font-bold text-[#1B3078]">{c._count.donaciones}</p>
                          <p className="text-xs text-gray-400">donaciones</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#00A8E8]">{c._count.usuarios}</p>
                          <p className="text-xs text-gray-400">voluntarios</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="flex items-center gap-1 text-[#00A8E8] text-sm font-medium group-hover:gap-2 transition-all">
                          Ver detalles <ArrowRight size={14} />
                        </span>
                        {c.whatsapp && (
                          <a href={waUrl(c.whatsapp)} target="_blank" rel="noopener noreferrer"
                            className="relative z-[2] flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs font-semibold hover:underline">
                            <MessageCircle size={13} /> Contacto
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="py-16 px-6 lg:px-12 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#00A8E8] text-sm font-bold uppercase tracking-widest">El proceso</span>
          <h2 className="text-3xl font-bold text-[#1B3078] mt-2 mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step:"01", icon:Heart,   title:"Se reciben donaciones",   desc:"Voluntarios registran cada producto con categoría y cantidad exacta" },
              { step:"02", icon:Package, title:"Se organiza el inventario", desc:"El sistema mantiene el inventario actualizado en tiempo real automáticamente" },
              { step:"03", icon:MapPin,  title:"Se envía a Venezuela",     desc:"Los envíos se preparan, confirman y rastrean hasta su entrega final" },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="absolute top-0 right-1/2 translate-x-8 -translate-y-1 text-[#EEF1FB] font-black text-6xl select-none leading-none">{step}</div>
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#EEF1FB] flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-[#1B3078]" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-6 bg-[#1B3078]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">¿Tienes un centro de acopio?</h2>
          <p className="text-white/70 mb-8">
            Regístralo tú mismo en minutos y empieza a gestionar tus donaciones. Quedarás como responsable y podrás sumar a tu equipo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/registrar-centro" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00A8E8] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#0090C8] transition-colors">
              Registra tu centro <ArrowRight size={16} />
            </Link>
            <Link href="/como-funciona" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f1f5c] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold text-white tracking-tight">
            Acopio<span className="text-[#00A8E8]"> Venezuela</span>
          </span>
          <p className="text-white/40 text-xs text-center">
            Sistema de Gestión de Centros de Acopio · Acopio Venezuela · {new Date().getFullYear()}
          </p>
          <Link href="/login" className="text-[#00A8E8] text-sm font-medium hover:underline">
            Acceso voluntarios →
          </Link>
        </div>
      </footer>
    </div>
  );
}
