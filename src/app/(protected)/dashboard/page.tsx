"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import {
  Package, Building2, Users, TrendingUp, Truck, SlidersHorizontal, Boxes,
  Scale, Droplet, Hash, Layers,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils";
import { puedePortalAdmin } from "@/lib/permisos";

const COLORS = ["#1B3078", "#00A8E8", "#2440A0", "#33BDF0", "#0090C8", "#142360", "#5B7FE0", "#7AD0F5", "#3CA5D8", "#0E2148"];
const ESTADO_BADGE: Record<string, "warning" | "info" | "success"> = { PREPARANDO: "warning", EN_TRANSITO: "info", ENTREGADO: "success" };
const ESTADO_LABEL: Record<string, string> = { PREPARANDO: "Preparando", EN_TRANSITO: "En tránsito", ENTREGADO: "Entregado" };
const ESTADO_COLOR: Record<string, string> = { PREPARANDO: "#F59E0B", EN_TRANSITO: "#00A8E8", ENTREGADO: "#22C55E" };

const unidadLabel = (u?: string) =>
  ({ KG: "kg", LITROS: "L", UNIDADES: "u" } as Record<string, string>)[u ?? ""] ?? "";

interface Filtros { pais: string; ciudad: string; centroId: string }

// ── Dona con leyenda al lado ────────────────────────────────────────────────────
function DonutCard({ title, data, emptyText }: {
  title: string;
  data: { name: string; value: number; color: string }[];
  emptyText: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{emptyText}</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={180} className="max-w-[200px]">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={48} outerRadius={75} paddingAngle={2}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatNumber(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {data.filter(d => d.value > 0).map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-gray-600 truncate flex-1">{d.name}</span>
                  <span className="font-semibold text-gray-800">{formatNumber(d.value)}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{Math.round((d.value / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const rol = session?.user?.rol;
  const conFiltros = puedePortalAdmin(rol);

  const [data, setData] = useState<any>(null);
  const [listas, setListas] = useState<{ donaciones: any[]; envios: any[] }>({ donaciones: [], envios: [] });
  const [centrosOpts, setCentrosOpts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({ pais: "", ciudad: "", centroId: "" });

  // Opciones de filtro (centros) — solo para superadmin / admin de país
  useEffect(() => {
    if (conFiltros) {
      fetch("/api/centros").then(r => r.json()).then(d => { if (Array.isArray(d)) setCentrosOpts(d); });
    }
  }, [conFiltros]);

  // Categorías para el filtro
  useEffect(() => {
    fetch("/api/categorias").then(r => r.json()).then(d => { if (Array.isArray(d)) setCategorias(d); });
  }, []);

  // Click / Ctrl+click en una categoría
  const toggleCat = (cat: string, additive: boolean) => {
    setSelectedCats(prev => {
      if (additive) return prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      return prev.length === 1 && prev[0] === cat ? [] : [cat];
    });
  };

  // Cargar dashboard + listas según filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (filtros.pais) params.set("pais", filtros.pais);
    if (filtros.ciudad) params.set("ciudad", filtros.ciudad);
    if (filtros.centroId) params.set("centroId", filtros.centroId);
    if (selectedCats.length) params.set("categorias", selectedCats.join(","));
    const qs = params.toString();

    const load = () => {
      const listParams = filtros.centroId ? `?centroId=${filtros.centroId}` : "";
      Promise.all([
        fetch(`/api/dashboard${qs ? `?${qs}` : ""}`).then(r => r.json()),
        fetch(`/api/donaciones${listParams}`).then(r => r.json()),
        fetch(`/api/envios${listParams}`).then(r => r.json()),
      ]).then(([dash, don, env]) => {
        setData(dash);
        const donaciones = Array.isArray(don) ? don : (don?.data ?? []);
        setListas({
          donaciones: donaciones.slice(0, 5),
          envios: Array.isArray(env) ? env.slice(0, 5) : [],
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [filtros, selectedCats]);

  // Opciones cascada
  const paises = useMemo(() => [...new Set(centrosOpts.map(c => c.pais))].sort(), [centrosOpts]);
  const ciudades = useMemo(() =>
    [...new Set(centrosOpts.filter(c => !filtros.pais || c.pais === filtros.pais).map(c => c.ciudad))].sort(),
    [centrosOpts, filtros.pais]);
  const centrosCascada = useMemo(() =>
    centrosOpts.filter(c => (!filtros.pais || c.pais === filtros.pais) && (!filtros.ciudad || c.ciudad === filtros.ciudad)),
    [centrosOpts, filtros.pais, filtros.ciudad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
      </div>
    );
  }
  if (!data) return <p className="text-gray-500">Error cargando datos.</p>;

  const inventario: any[] = data.inventariosTop || [];

  // Inventario por categoría (suma)
  const dataPorCategoria = (() => {
    const map: Record<string, number> = {};
    for (const inv of inventario) {
      const cat = inv.producto.categoria?.nombre || "Sin categoría";
      map[cat] = (map[cat] || 0) + inv.cantidadTotal;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  // Con una sola categoría seleccionada, el gráfico muestra sus productos; si no, las categorías
  const mostrarProductos = selectedCats.length === 1;
  const dataProductos = inventario
    .map(inv => ({ name: inv.producto.nombre, value: inv.cantidadTotal, unidad: unidadLabel(inv.producto.unidad) }))
    .sort((a, b) => b.value - a.value);

  const chartData = mostrarProductos ? dataProductos : dataPorCategoria;
  const ROW_H = 46;
  const barChartHeight = chartData.length * ROW_H + 40;

  const donutCategorias = dataPorCategoria.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
  const ep = data.enviosPorEstado || {};
  const donutEnvios = [
    { name: "Preparando", value: ep.PREPARANDO || 0, color: ESTADO_COLOR.PREPARANDO },
    { name: "En tránsito", value: ep.EN_TRANSITO || 0, color: ESTADO_COLOR.EN_TRANSITO },
    { name: "Entregado", value: ep.ENTREGADO || 0, color: ESTADO_COLOR.ENTREGADO },
  ];

  const filtroActivo = filtros.pais || filtros.ciudad || filtros.centroId;
  const centroSel = centrosOpts.find(c => c.id === filtros.centroId);
  const ambito = filtros.centroId ? centroSel?.nombre
    : filtros.ciudad ? `${filtros.ciudad}, ${filtros.pais}`
    : filtros.pais ? filtros.pais
    : conFiltros ? "Vista global" : (session?.user?.centrNombre || "Mi centro");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{session?.user?.name} — {ambito}</p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">Actualización automática cada 30s</div>
      </div>

      {/* Filtros */}
      {conFiltros && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <SlidersHorizontal size={13} /> Filtrar por ubicación
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={filtros.pais} onChange={e => setFiltros({ pais: e.target.value, ciudad: "", centroId: "" })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todos los países</option>
              {paises.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filtros.ciudad} onChange={e => setFiltros(f => ({ ...f, ciudad: e.target.value, centroId: "" }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todas las ciudades</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtros.centroId} onChange={e => setFiltros(f => ({ ...f, centroId: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todos los centros</option>
              {centrosCascada.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</option>)}
            </select>
          </div>
          {filtroActivo && (
            <button onClick={() => setFiltros({ pais: "", ciudad: "", centroId: "" })}
              className="text-xs text-[#1B3078] font-medium hover:underline">Limpiar filtros</button>
          )}
        </div>
      )}

      {/* Filtro por categoría */}
      {categorias.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Layers size={13} /> Filtrar por categoría
            </span>
            {selectedCats.length > 0 && (
              <button onClick={() => setSelectedCats([])} className="text-xs text-[#1B3078] font-medium hover:underline">
                Limpiar ({selectedCats.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categorias.map((c: any) => {
              const sel = selectedCats.includes(c.nombre);
              return (
                <button key={c.id}
                  onClick={(e) => toggleCat(c.nombre, e.ctrlKey || e.metaKey)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${sel ? "bg-[#1B3078] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {c.nombre}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            Clic para filtrar por una categoría · Ctrl/Cmd + clic para seleccionar varias
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Donaciones"      value={data.totalDonaciones} icon={<TrendingUp size={22} />} />
        <StatCard title="Centros activos" value={data.totalCentros}    icon={<Building2 size={22} />} />
        <StatCard title="Envíos"          value={data.totalEnvios}     icon={<Truck size={22} />} />
        <StatCard title="Voluntarios"     value={data.totalUsuarios}   icon={<Users size={22} />} />
      </div>

      {/* Total recolectado por unidad */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Total recolectado</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="En peso"     value={data.recolectado?.KG ?? 0}       suffix="kg" icon={<Scale size={22} />} />
          <StatCard title="En volumen"  value={data.recolectado?.LITROS ?? 0}   suffix="L"  icon={<Droplet size={22} />} />
          <StatCard title="En unidades" value={data.recolectado?.UNIDADES ?? 0} suffix="u"  icon={<Hash size={22} />} />
        </div>
      </div>

      {/* Donaciones en el tiempo */}
      <Card>
        <CardHeader><CardTitle>Donaciones — Últimos 14 días</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.donacionesPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B3078" radius={[4, 4, 0, 0]} name="Donaciones" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donas: distribución por categoría + envíos por estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Distribución del inventario por categoría"
          data={donutCategorias} emptyText="Sin inventario para mostrar" />
        <DonutCard title="Envíos por estado"
          data={donutEnvios} emptyText="Sin envíos registrados" />
      </div>

      {/* Inventario por categoría (drill-down) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Boxes size={16} className="text-[#1B3078]" />
              {mostrarProductos ? `Productos · ${selectedCats[0]}` : "Inventario por categoría"}
            </CardTitle>
            {!mostrarProductos && inventario.length > 0 && (
              <span className="text-xs text-gray-400">Clic en una barra para filtrar</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {inventario.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto pr-1">
              <ResponsiveContainer width="100%" height={barChartHeight}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} interval={0} />
                  <Tooltip formatter={(value: any, _n: any, props: any) => {
                    const u = props?.payload?.unidad;
                    return [u ? `${formatNumber(value)} ${u}` : formatNumber(value), mostrarProductos ? "Cantidad" : "Total"];
                  }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Inventario" barSize={22}
                    cursor={mostrarProductos ? "default" : "pointer"}
                    onClick={(d: any, _i: any, e: any) => { if (!mostrarProductos && d?.name) toggleCat(d.name, e?.ctrlKey || e?.metaKey); }}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Registra donaciones para ver estadísticas</div>
          )}
        </CardContent>
      </Card>

      {/* Últimas donaciones y envíos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package size={16} className="text-[#1B3078]" /> Últimas donaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listas.donaciones.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">Sin donaciones aún</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {listas.donaciones.map((d: any) => (
                  <li key={d.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.donante || "Anónimo"}</p>
                      <p className="text-xs text-gray-400 truncate">{d.centroAcopio?.nombre} · {d.items?.length} productos</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0 ml-3">{formatDate(d.creadoEn)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck size={16} className="text-[#00A8E8]" /> Últimos envíos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listas.envios.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">Sin envíos aún</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {listas.envios.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{e.destino}</p>
                      <p className="text-xs text-gray-400 truncate">{e.centroAcopio?.nombre}</p>
                    </div>
                    <Badge variant={ESTADO_BADGE[e.estado]}>{ESTADO_LABEL[e.estado]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Centros */}
      <Card>
        <CardHeader><CardTitle>Desempeño por centro de acopio</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#EEF1FB] border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-[#1B3078] font-semibold">Centro</th>
                  <th className="text-left px-6 py-3 text-[#1B3078] font-semibold">Ubicación</th>
                  <th className="text-right px-6 py-3 text-[#1B3078] font-semibold">Donaciones</th>
                  <th className="text-right px-6 py-3 text-[#1B3078] font-semibold">Envíos</th>
                  <th className="text-right px-6 py-3 text-[#1B3078] font-semibold">Voluntarios</th>
                  <th className="text-right px-6 py-3 text-[#1B3078] font-semibold">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.centrosStats.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#EEF1FB]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-6 py-4 text-gray-500">{c.ciudad}, {c.pais}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{c.donaciones}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{c.envios}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{c.voluntarios}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[#1B3078]">{formatNumber(c.totalItems)}</td>
                  </tr>
                ))}
                {data.centrosStats.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No hay centros que coincidan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
