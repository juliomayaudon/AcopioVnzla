"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin, Package, Users, ArrowLeft, Heart, MessageCircle, Scale, Droplet, Hash } from "lucide-react";
import { DonutCard } from "@/components/donut-card";

const COLORS = ["#1B3078", "#00A8E8", "#2440A0", "#33BDF0", "#0090C8", "#142360", "#5B7FE0", "#7AD0F5", "#3CA5D8", "#0E2148"];

function waUrl(numero: string) {
  return `https://wa.me/${numero.replace(/\D/g, "")}`;
}
const unidadLabel = (u?: string) =>
  ({ KG: "kg", LITROS: "L", UNIDADES: "unidades" } as Record<string, string>)[u ?? ""] ?? (u ?? "").toLowerCase();
const smartNum = (n: number) => (n % 1 === 0 ? String(n) : parseFloat(n.toFixed(2)).toString());
import type { CentroMapa } from "@/components/map-view";

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

export default function CentroPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [centro, setCentro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [catSel, setCatSel] = useState<string | null>(null); // categoría seleccionada en el inventario

  useEffect(() => {
    fetch(`/api/centros/${id}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setCentro(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3078]" />
    </div>
  );

  if (!centro) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <p className="text-gray-500 text-lg">Centro no encontrado</p>
      <Link href="/" className="text-[#00A8E8] hover:underline flex items-center gap-1">
        <ArrowLeft size={16} /> Volver al inicio
      </Link>
    </div>
  );

  const mapCentro: CentroMapa[] = centro.latitud && centro.longitud
    ? [{ id: centro.id, nombre: centro.nombre, ciudad: centro.ciudad, pais: centro.pais,
        latitud: centro.latitud, longitud: centro.longitud, _count: centro._count }]
    : [];

  const inventario = (centro.inventarios || []).filter((i: any) => i.cantidadTotal > 0);

  // Inventario agrupado por categoría (suma de cantidades)
  const inventarioPorCategoria = (() => {
    const map: Record<string, number> = {};
    for (const i of inventario) {
      const cat = i.producto.categoria?.nombre || "Sin categoría";
      map[cat] = (map[cat] || 0) + i.cantidadTotal;
    }
    return Object.entries(map)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  })();

  // Productos de la categoría seleccionada (drill-down)
  const productosDeCategoria = catSel
    ? inventario
        .filter((i: any) => (i.producto.categoria?.nombre || "Sin categoría") === catSel)
        .sort((a: any, b: any) => b.cantidadTotal - a.cantidadTotal)
    : [];

  // Total recolectado por unidad
  const reco = centro.recolectado || { KG: 0, LITROS: 0, UNIDADES: 0 };
  const recoCards = [
    { icon: Scale,   label: "En peso",     value: reco.KG,       unit: "kg" },
    { icon: Droplet, label: "En volumen",  value: reco.LITROS,   unit: "L" },
    { icon: Hash,    label: "En unidades", value: reco.UNIDADES, unit: "u" },
  ];

  // Inventario disponible actual por unidad
  const invUnidad: Record<string, number> = { KG: 0, LITROS: 0, UNIDADES: 0 };
  for (const i of inventario) invUnidad[i.producto.unidad] = (invUnidad[i.producto.unidad] || 0) + i.cantidadTotal;

  // Envíos por estado
  const ep = centro.enviosPorEstado || {};
  const estados = [
    { k: "PREPARANDO",  label: "Preparando",  color: "#F59E0B", value: ep.PREPARANDO || 0 },
    { k: "EN_TRANSITO", label: "En tránsito", color: "#00A8E8", value: ep.EN_TRANSITO || 0 },
    { k: "ENTREGADO",   label: "Entregado",   color: "#22C55E", value: ep.ENTREGADO || 0 },
  ];
  const totalEnvios = estados.reduce((s, e) => s + e.value, 0);

  // Datos para las donas
  const donutCategorias = inventarioPorCategoria.map((c, i) => ({ name: c.nombre, value: c.total, color: COLORS[i % COLORS.length] }));
  const donutEnvios = estados.map((e) => ({ name: e.label, value: e.value, color: e.color }));
  const donacionesPorDia = centro.donacionesPorDia || [];
  const hayDonacionesRecientes = donacionesPorDia.some((d: any) => d.count > 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-5 gap-4">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#1B3078] text-sm font-medium">
          <ArrowLeft size={16} /> Inicio
        </Link>
        <div className="ml-auto">
          <img src="/Operacion_transparente.svg" alt="Operación Todos con Venezuela" style={{ height: 34, width: "auto" }} />
        </div>
      </nav>

      {/* Hero del centro — con banner o gradiente */}
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        {centro.bannerUrl
          ? (
            <>
              <img src={centro.bannerUrl} alt={centro.nombre}
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(27,48,120,0.55) 0%, rgba(27,48,120,0.85) 100%)" }} />
            </>
          )
          : <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1B3078 0%, #1e3a8a 100%)" }} />
        }
        <div className="relative px-6 py-14 text-center">
          <p className="text-[#00A8E8] text-sm font-bold uppercase tracking-widest mb-3">Centro de Acopio</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{centro.nombre}</h1>
          <p className="text-white/70 flex items-center justify-center gap-1 text-sm">
            <MapPin size={14} /> {centro.ciudad}, {centro.pais}
            {centro.direccion && <span className="text-white/50 ml-1">· {centro.direccion}</span>}
          </p>

        {/* Stats del centro */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-10">
          {[
            { icon: Heart,   label: "Donaciones", value: centro._count.donaciones },
            { icon: Package, label: "Envíos",     value: centro._count.envios },
            { icon: Users,   label: "Voluntarios",value: centro._count?.usuarios ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <Icon size={18} className="text-[#00A8E8] mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-white/50 text-xs">{label}</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-8">

        {/* Total recolectado por unidad */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Lo que se ha recolectado</h2>
          <p className="text-sm text-gray-500 mb-4">Total recibido en este centro, separado por tipo de medida.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recoCards.map(({ icon: Icon, label, value, unit }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-[#1B3078]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">
                    {smartNum(value)} <span className="text-base font-medium text-gray-400">{unit}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donaciones en el tiempo */}
        {hayDonacionesRecientes && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Donaciones — últimos 14 días</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={donacionesPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1B3078" radius={[4, 4, 0, 0]} name="Donaciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Donas: distribución por categoría + envíos por estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutCard title="Distribución del inventario por categoría"
            data={donutCategorias} emptyText="Sin inventario para mostrar" />
          <DonutCard title="Envíos por estado"
            data={donutEnvios} emptyText="Sin envíos registrados" />
        </div>

        {/* Mapa */}
        {mapCentro.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ubicación</h2>
            <div className="rounded-2xl overflow-hidden shadow border border-gray-100" style={{ height: 280 }}>
              <MapView centros={mapCentro} />
            </div>
          </div>
        )}

        {/* Info + inventario */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Información del centro</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Responsable", value: centro.responsable },
                { label: "Ciudad",      value: centro.ciudad },
                { label: "País",        value: centro.pais },
                centro.direccion && { label: "Dirección", value: centro.direccion, long: true },
                centro.telefono  && { label: "Teléfono",  value: centro.telefono },
                centro.email     && { label: "Email",     value: centro.email },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label}
                  className={`py-2 border-b border-gray-50 last:border-0 ${item.long ? "flex flex-col gap-0.5" : "flex justify-between items-center"}`}>
                  <span className="text-gray-400 shrink-0">{item.label}</span>
                  <span className="text-gray-800 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventario */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 gap-2">
              {catSel ? (
                <button onClick={() => setCatSel(null)}
                  className="flex items-center gap-1.5 text-lg font-bold text-gray-900 hover:text-[#1B3078] transition-colors">
                  <ArrowLeft size={18} /> {catSel}
                </button>
              ) : (
                <h2 className="text-lg font-bold text-gray-900">Inventario disponible</h2>
              )}
              {!catSel && inventario.length > 0 && (
                <span className="text-xs text-gray-400">Por categoría</span>
              )}
            </div>

            {/* Resumen de lo disponible ahora */}
            {!catSel && inventario.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {invUnidad.KG > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">
                    <Scale size={12} className="text-[#1B3078]" /> <strong className="text-gray-800">{smartNum(invUnidad.KG)} kg</strong>
                  </span>
                )}
                {invUnidad.LITROS > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">
                    <Droplet size={12} className="text-[#1B3078]" /> <strong className="text-gray-800">{smartNum(invUnidad.LITROS)} L</strong>
                  </span>
                )}
                {invUnidad.UNIDADES > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">
                    <Hash size={12} className="text-[#1B3078]" /> <strong className="text-gray-800">{smartNum(invUnidad.UNIDADES)} u</strong>
                  </span>
                )}
              </div>
            )}

            {inventario.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin inventario registrado aún</p>
              </div>
            ) : catSel ? (
              /* Drill-down: productos de la categoría */
              <div className="space-y-2">
                {(() => {
                  const max = Math.max(...productosDeCategoria.map((i: any) => i.cantidadTotal));
                  return productosDeCategoria.map((inv: any) => {
                    const pct = Math.round((inv.cantidadTotal / max) * 100);
                    return (
                      <div key={inv.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{inv.producto.nombre}</span>
                          <span className="text-gray-400 text-xs">
                            {smartNum(inv.cantidadTotal)} {unidadLabel(inv.producto.unidad)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A8E8] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              /* Vista por categoría — clic para ver productos */
              <div className="space-y-2">
                {(() => {
                  const max = Math.max(...inventarioPorCategoria.map((c) => c.total));
                  return inventarioPorCategoria.map((c) => {
                    const pct = Math.round((c.total / max) * 100);
                    return (
                      <button key={c.nombre} onClick={() => setCatSel(c.nombre)}
                        className="w-full text-left group">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium group-hover:text-[#1B3078] transition-colors">{c.nombre}</span>
                          <span className="text-gray-400 text-xs group-hover:text-[#1B3078] transition-colors">Ver productos ›</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1B3078] rounded-full transition-all group-hover:bg-[#00A8E8]" style={{ width: `${pct}%` }} />
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#1B3078] rounded-2xl p-8 text-center">
          <MessageCircle size={28} className="text-[#00A8E8] mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg mb-2">¿Quieres ayudar desde aquí?</h3>
          <p className="text-white/60 text-sm mb-6">
            Contáctanos por WhatsApp para unirte como voluntario y empezar a ayudar en este centro.
          </p>
          {centro.whatsapp ? (
            <a
              href={waUrl(centro.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00A8E8] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0090C8] transition-colors text-sm"
            >
              <MessageCircle size={18} />
              Unirme como voluntario
            </a>
          ) : (
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-[#00A8E8] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0090C8] transition-colors text-sm">
              Ingresar al sistema
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
