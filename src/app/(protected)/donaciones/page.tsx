"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Plus, PackagePlus, Trash2, X, Hash, Layers, Search,
  ChevronLeft, ChevronRight, SlidersHorizontal, User,
  Building2, Calendar, FileText, Package, ChevronDown, ChevronUp, Eye, Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { puedePortalAdmin } from "@/lib/permisos";

// ── helpers ───────────────────────────────────────────────────────────────────
function unidadLabel(u?: string) {
  const map: Record<string, string> = { KG: "kg", LITROS: "L", UNIDADES: "unidades" };
  return map[u ?? ""] ?? (u ?? "").toLowerCase();
}
function smartNum(n: number) {
  if (n === 0) return "0";
  return n % 1 === 0 ? String(n) : parseFloat(n.toFixed(3)).toString();
}
function formatItemCantidad(item: DonItem) {
  const { producto: p, cantidadUnidades, cantidad } = item;
  if (cantidadUnidades && cantidadUnidades > 0 && p.unidad !== "UNIDADES") {
    const tamano = parseFloat((cantidad / cantidadUnidades).toFixed(4));
    return `${smartNum(cantidadUnidades)} unid. × ${smartNum(tamano)} ${unidadLabel(p.unidad)} = ${smartNum(cantidad)} ${unidadLabel(p.unidad)}`;
  }
  return `${smartNum(cantidad)} ${unidadLabel(p.unidad)}`;
}

// ── types ─────────────────────────────────────────────────────────────────────
interface Producto { id: string; nombre: string; unidad: string; categoria: { nombre: string } }
interface ItemForm {
  productoId: string; cantidad: number; cantidadUnidades: number;
  tamanoUnidad: number; desglose: boolean; notas: string;
}
interface DonItem {
  id: string; cantidad: number; cantidadUnidades?: number | null; notas?: string | null;
  producto: { nombre: string; unidad: string; categoria: { nombre: string } };
}
interface Donacion {
  id: string; donante?: string | null; nacionalidadDonante?: string | null;
  notas?: string | null; creadoEn: string;
  centroAcopio: { nombre: string; ciudad: string; pais?: string };
  registradoPor?: { nombre: string } | null;
  items: DonItem[];
  fotos?: { id: string; url: string }[];
}
interface Filters { page: number; search: string; pais: string; ciudad: string; centroId: string; periodo: string }

const BLANK_ITEM: ItemForm = {
  productoId: "", cantidad: 0, cantidadUnidades: 0, tamanoUnidad: 0, desglose: false, notas: "",
};
const PERIODOS = [
  { value: "todos",  label: "Todos" },
  { value: "hoy",    label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes",    label: "Este mes" },
];
const NACIONALIDADES = [
  "Venezolana", "Ecuatoriana", "Colombiana", "Peruana", "Chilena",
  "Argentina", "Boliviana", "Brasileña", "Panameña", "Mexicana",
  "Estadounidense", "Española", "Italiana", "Portuguesa", "Otra",
];

// ── ProductoCombobox ──────────────────────────────────────────────────────────
function ProductoCombobox({ value, productos, onChange }: {
  value: string; productos: Producto[]; onChange: (id: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });
  const btnRef   = useRef<HTMLButtonElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected   = productos.find(p => p.id === value);
  const categorias = useMemo(() => [...new Set(productos.map(p => p.categoria.nombre))].sort(), [productos]);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const q          = norm(search.trim());
  const filtered   = q
    ? productos.filter(p => norm(p.nombre).includes(q) || norm(p.categoria.nombre).includes(q))
    : productos;

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleSelect = (id: string) => { onChange(id); setOpen(false); setSearch(""); };

  const dropdown = open ? (
    <div ref={dropRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto o categoría..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]" />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {q ? (
          filtered.length === 0
            ? <p className="text-xs text-gray-400 text-center py-5">Sin resultados para "{search}"</p>
            : filtered.map(p => (
              <button key={p.id} type="button" onClick={() => handleSelect(p.id)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 hover:bg-[#EEF1FB] transition-colors ${p.id === value ? "bg-[#EEF1FB] text-[#1B3078] font-medium" : ""}`}>
                <span>{p.nombre}</span>
                <span className="text-xs text-gray-400 shrink-0">{p.categoria.nombre}</span>
              </button>
            ))
        ) : (
          categorias.map(cat => {
            const prods = filtered.filter(p => p.categoria.nombre === cat);
            if (!prods.length) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1.5 bg-gray-50 sticky top-0">{cat}</p>
                {prods.map(p => (
                  <button key={p.id} type="button" onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#EEF1FB] transition-colors ${p.id === value ? "bg-[#EEF1FB] text-[#1B3078] font-medium" : ""}`}>
                    {p.nombre}
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex-1 min-w-0">
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="w-full text-left text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078] flex items-center justify-between gap-2">
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
          {selected ? selected.nombre : "Seleccionar producto..."}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({ idx, item, productos, onChange, onRemove, canRemove }: {
  idx: number; item: ItemForm; productos: Producto[];
  onChange: (i: number, v: Partial<ItemForm>) => void;
  onRemove: (i: number) => void; canRemove: boolean;
}) {
  const prod      = productos.find(p => p.id === item.productoId) ?? null;
  const esVolumen = prod?.unidad === "LITROS" || prod?.unidad === "KG";

  const handleProducto = (id: string) =>
    onChange(idx, { productoId: id, cantidad: 0, cantidadUnidades: 0, tamanoUnidad: 0, desglose: false });

  const handleUnidades = (n: number) => {
    const total = item.tamanoUnidad > 0 ? parseFloat((n * item.tamanoUnidad).toFixed(6)) : 0;
    onChange(idx, { cantidadUnidades: n, cantidad: total });
  };
  const handleTamano = (t: number) => {
    const total = item.cantidadUnidades > 0 ? parseFloat((item.cantidadUnidades * t).toFixed(6)) : 0;
    onChange(idx, { tamanoUnidad: t, cantidad: total });
  };
  const totalCalc = item.cantidadUnidades > 0 && item.tamanoUnidad > 0
    ? parseFloat((item.cantidadUnidades * item.tamanoUnidad).toFixed(4)) : null;

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5 border border-gray-100">
      <div className="flex gap-2 items-start">
        <ProductoCombobox value={item.productoId} productos={productos} onChange={handleProducto} />
        {canRemove && (
          <button type="button" onClick={() => onRemove(idx)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-0.5">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {prod && (
        <div className="space-y-2">
          {esVolumen && (
            <button type="button"
              onClick={() => onChange(idx, { desglose: !item.desglose, cantidad: 0, cantidadUnidades: 0, tamanoUnidad: 0 })}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${item.desglose ? "bg-[#EEF1FB] text-[#1B3078]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <Layers size={12} />
              {item.desglose ? "Desglosando por unidades" : "Calcular por unidades"}
            </button>
          )}

          {item.desglose && esVolumen ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                <Hash size={13} className="text-gray-400" />
                <input type="number" min="0" step="1" value={item.cantidadUnidades || ""}
                  onChange={e => handleUnidades(Number(e.target.value))} placeholder="0"
                  className="w-14 text-sm text-center focus:outline-none bg-transparent font-medium" />
              </div>
              <span className="text-gray-400 text-sm">unid. ×</span>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                <input type="number" min="0" step="0.001" value={item.tamanoUnidad || ""}
                  onChange={e => handleTamano(Number(e.target.value))} placeholder="0"
                  className="w-16 text-sm text-center focus:outline-none bg-transparent font-medium" />
                <span className="text-xs text-gray-500 font-medium">{unidadLabel(prod.unidad)}</span>
              </div>
              {totalCalc !== null ? (
                <><span className="text-gray-400 text-sm">=</span>
                  <span className="text-[#1B3078] font-bold text-sm bg-[#EEF1FB] px-2 py-1 rounded-lg">
                    {smartNum(totalCalc)} {unidadLabel(prod.unidad)}
                  </span></>
              ) : <span className="text-gray-300 text-sm">= ? {unidadLabel(prod.unidad)}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                <input type="number" min="0" step={prod.unidad === "UNIDADES" ? "1" : "0.001"}
                  value={item.cantidad || ""}
                  onChange={e => onChange(idx, { cantidad: Number(e.target.value) })} placeholder="0"
                  className="w-20 text-sm text-center focus:outline-none bg-transparent font-medium" />
              </div>
              <span className="text-gray-600 text-sm font-medium">{unidadLabel(prod.unidad)}</span>
            </div>
          )}
        </div>
      )}

      {prod && (
        <input type="text" value={item.notas} onChange={e => onChange(idx, { notas: e.target.value })}
          placeholder="Notas (opcional)"
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-600 placeholder-gray-300" />
      )}
    </div>
  );
}

// ── DonacionDetail ────────────────────────────────────────────────────────────
function DonacionDetail({ don, onClose }: { don: Donacion; onClose: () => void }) {
  // Group items by category
  const byCategoria = useMemo(() => {
    const map: Record<string, DonItem[]> = {};
    for (const item of don.items) {
      const cat = item.producto.categoria.nombre;
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [don.items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detalle de donación</p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {don.donante || <span className="italic font-normal text-gray-400">Donante anónimo</span>}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Info general */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar size={15} className="text-[#1B3078]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Fecha y hora</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">{formatDate(don.creadoEn)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={15} className="text-[#1B3078]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Centro de acopio</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">{don.centroAcopio.nombre}</p>
                <p className="text-xs text-gray-400">
                  {don.centroAcopio.ciudad}{don.centroAcopio.pais ? `, ${don.centroAcopio.pais}` : ""}
                </p>
              </div>
            </div>

            {don.nacionalidadDonante && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} className="text-[#1B3078]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Nacionalidad del donante</p>
                  <p className="text-sm text-gray-800 font-semibold mt-0.5">{don.nacionalidadDonante}</p>
                </div>
              </div>
            )}

            {don.registradoPor && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} className="text-[#1B3078]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Registrado por</p>
                  <p className="text-sm text-gray-800 font-semibold mt-0.5">{don.registradoPor.nombre}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">
                <Package size={15} className="text-[#1B3078]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total de productos</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">
                  {don.items.length} tipo{don.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {don.notas && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Notas</p>
                <p className="text-sm text-gray-700 leading-relaxed">{don.notas}</p>
              </div>
            </div>
          )}

          {/* Productos agrupados por categoría */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Productos donados</p>
            <div className="space-y-3">
              {Object.entries(byCategoria).map(([cat, catItems]) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">{cat}</p>
                  <div className="space-y-1.5">
                    {catItems.map(item => (
                      <div key={item.id}
                        className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{item.producto.nombre}</p>
                          {item.notas && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{item.notas}</p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#1B3078] whitespace-nowrap shrink-0 mt-0.5">
                          {formatItemCantidad(item)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fotos */}
          {don.fotos && don.fotos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Fotos</p>
              <div className="flex gap-2 flex-wrap">
                {don.fotos.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
                    <img src={f.url} alt="foto donación"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, pages, total, limit, onChange }: {
  page: number; pages: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const nums: (number | "…")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("…");
    nums.push(pages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-xs text-gray-400 order-2 sm:order-1">
        Mostrando {from}–{to} de {total} donaciones
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={16} />
        </button>
        {nums.map((n, i) =>
          n === "…"
            ? <span key={`e${i}`} className="px-1.5 text-gray-300 text-sm select-none">…</span>
            : <button key={n} onClick={() => onChange(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${n === page ? "bg-[#1B3078] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {n}
              </button>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DonacionesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.rol === "SUPERADMIN";
  const conFiltros = puedePortalAdmin(session?.user?.rol);

  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDon, setSelectedDon] = useState<Donacion | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    page: 1, search: "", pais: "", ciudad: "", centroId: "", periodo: "todos",
  });

  const [productos, setProductos] = useState<Producto[]>([]);
  const [centros, setCentros]     = useState<any[]>([]);

  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [donante, setDonante]               = useState("");
  const [nacionalidad, setNacionalidad]     = useState("");
  const [notas, setNotas]                   = useState("");
  const [centroAcopioId, setCentroAcopioId] = useState("");
  const [items, setItems] = useState<ItemForm[]>([{ ...BLANK_ITEM }]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearch  = useRef(filters.search);

  useEffect(() => {
    const delay = filters.search !== prevSearch.current ? 400 : 0;
    prevSearch.current = filters.search;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = buildParams();
      params.set("page", String(filters.page));
      params.set("limit", "10");
      setLoading(true);
      fetch(`/api/donaciones?${params}`)
        .then(r => r.json())
        .then(d => {
          if (d.data) { setDonaciones(d.data); setTotal(d.total); setPages(d.pages); }
          setLoading(false);
        });
    }, delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters]);

  useEffect(() => {
    fetch("/api/productos").then(r => r.json()).then(d => { if (Array.isArray(d)) setProductos(d); });
    if (conFiltros) {
      fetch("/api/centros").then(r => r.json()).then(d => { if (Array.isArray(d)) setCentros(d); });
    }
  }, [conFiltros]);

  // Parámetros de filtro (sin paginación) — reutilizados por listado y export
  const buildParams = () => {
    const p = new URLSearchParams();
    if (filters.search)  p.set("search", filters.search);
    if (filters.pais)    p.set("pais", filters.pais);
    if (filters.ciudad)  p.set("ciudad", filters.ciudad);
    if (filters.centroId) p.set("centroId", filters.centroId);
    if (filters.periodo !== "todos") p.set("periodo", filters.periodo);
    return p;
  };

  // Opciones de filtro en cascada
  const paises = useMemo(() => [...new Set(centros.map((c: any) => c.pais))].sort(), [centros]);
  const ciudades = useMemo(() =>
    [...new Set(centros.filter((c: any) => !filters.pais || c.pais === filters.pais).map((c: any) => c.ciudad))].sort(),
    [centros, filters.pais]);
  const centrosCascada = useMemo(() =>
    centros.filter((c: any) => (!filters.pais || c.pais === filters.pais) && (!filters.ciudad || c.ciudad === filters.ciudad)),
    [centros, filters.pais, filters.ciudad]);

  const setSearch  = (s: string) => setFilters(f => ({ ...f, search: s, page: 1 }));
  const setPaisF   = (p: string) => setFilters(f => ({ ...f, pais: p, ciudad: "", centroId: "", page: 1 }));
  const setCiudadF = (c: string) => setFilters(f => ({ ...f, ciudad: c, centroId: "", page: 1 }));
  const setCentroF = (c: string) => setFilters(f => ({ ...f, centroId: c, page: 1 }));
  const setPeriodo = (p: string) => setFilters(f => ({ ...f, periodo: p, page: 1 }));
  const setPage    = (p: number) => setFilters(f => ({ ...f, page: p }));

  const descargarCSV = () => {
    const params = buildParams();
    window.open(`/api/donaciones/export?${params.toString()}`, "_blank");
  };

  const changeItem = (i: number, v: Partial<ItemForm>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...v } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const openModal = () => {
    setDonante(""); setNacionalidad(""); setNotas(""); setCentroAcopioId("");
    setItems([{ ...BLANK_ITEM }]); setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter(it => it.productoId && it.cantidad > 0);
    if (!valid.length) return;
    setSaving(true);
    const res = await fetch("/api/donaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donante: donante || undefined,
        nacionalidadDonante: nacionalidad || undefined,
        notas:   notas   || undefined,
        centroAcopioId: centroAcopioId || session?.user?.centroAcopioId,
        items: valid.map(it => ({
          productoId: it.productoId,
          cantidad: it.cantidad,
          cantidadUnidades: it.desglose && it.cantidadUnidades > 0 ? it.cantidadUnidades : null,
          notas: it.notas || undefined,
        })),
      }),
    });
    setSaving(false);
    if (res.ok) { setModal(false); setFilters(f => ({ ...f, page: 1 })); }
  };

  const validItems = items.filter(it => it.productoId && it.cantidad > 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
            <PackagePlus size={20} className="text-[#1B3078]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Donaciones</h1>
            <p className="text-gray-500 text-sm">{total > 0 ? `${total} registradas` : "Sin registros aún"}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" onClick={descargarCSV} disabled={total === 0}>
            <Download size={15} className="mr-1.5" /> Descargar CSV
          </Button>
          <Button onClick={openModal}>
            <Plus size={15} className="mr-1.5" /> Registrar donación
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <SlidersHorizontal size={13} /> Buscar y filtrar
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Buscar por donante o notas..."
            value={filters.search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]" />
        </div>

        {/* Filtros de ubicación — superadmin y admin de país */}
        {conFiltros && centros.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={filters.pais} onChange={e => setPaisF(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todos los países</option>
              {paises.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.ciudad} onChange={e => setCiudadF(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todas las ciudades</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.centroId} onChange={e => setCentroF(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
              <option value="">Todos los centros</option>
              {centrosCascada.map((c: any) => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filters.periodo === p.value ? "bg-[#1B3078] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
        </div>
      ) : donaciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <PackagePlus size={40} className="opacity-30" />
            <p className="text-sm">
              {filters.search || filters.periodo !== "todos" || filters.centroId || filters.pais || filters.ciudad
                ? "No hay donaciones que coincidan con los filtros"
                : "No hay donaciones registradas aún"}
            </p>
            {!filters.search && filters.periodo === "todos" && !filters.centroId && !filters.pais && !filters.ciudad && (
              <Button onClick={openModal}><Plus size={15} className="mr-1.5" /> Registrar primera donación</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {donaciones.map(don => {
            const expanded = expandedId === don.id;
            return (
              <Card key={don.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Cabecera — click expande/colapsa el desplegable */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : don.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {don.donante || <span className="text-gray-400 font-normal italic">Donante anónimo</span>}
                      </p>
                      <Badge variant="info">{don.items.length} producto{don.items.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(don.creadoEn)} · {don.centroAcopio.nombre}
                      {don.registradoPor && <> · por {don.registradoPor.nombre}</>}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {/* Botón ver detalle completo */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDon(don); }}
                      title="Ver detalle completo"
                      className="p-2 rounded-lg text-gray-400 hover:text-[#1B3078] hover:bg-[#EEF1FB] transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    {/* Toggle desplegable */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : don.id); }}
                      title={expanded ? "Ocultar productos" : "Ver productos"}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Desplegable — lista rápida de productos */}
                {expanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50/50">
                    {don.items.map(item => (
                      <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="font-medium text-gray-800">{item.producto.nombre}</span>
                          <span className="text-xs text-gray-400 ml-2">{item.producto.categoria.nombre}</span>
                          {item.notas && <p className="text-xs text-gray-400 mt-0.5">{item.notas}</p>}
                        </div>
                        <span className="text-[#1B3078] font-semibold whitespace-nowrap shrink-0 text-right">
                          {formatItemCantidad(item)}
                        </span>
                      </div>
                    ))}
                    {don.notas && (
                      <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 italic">{don.notas}</p>
                    )}
                    <button
                      onClick={() => setSelectedDon(don)}
                      className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#1B3078] hover:underline"
                    >
                      <Eye size={13} /> Ver detalle completo
                    </button>
                  </div>
                )}
              </Card>
            );
          })}

          <Pagination page={filters.page} pages={pages} total={total} limit={10} onChange={setPage} />
        </div>
      )}

      {/* Modal detalle */}
      {selectedDon && <DonacionDetail don={selectedDon} onClose={() => setSelectedDon(null)} />}

      {/* Modal registro */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">Registrar donación</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Donante <span className="text-gray-400">(opcional)</span></label>
                    <input type="text" value={donante} onChange={e => setDonante(e.target.value)}
                      placeholder="Nombre del donante o institución"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad del donante <span className="text-gray-400">(opcional)</span></label>
                    <select value={nacionalidad} onChange={e => setNacionalidad(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
                      <option value="">Sin especificar</option>
                      {NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  {conFiltros && centros.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Centro de acopio *</label>
                      <select value={centroAcopioId} onChange={e => setCentroAcopioId(e.target.value)} required
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 bg-white text-gray-700">
                        <option value="">Seleccionar centro...</option>
                        {centros.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas <span className="text-gray-400">(opcional)</span></label>
                    <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                      placeholder="Observaciones generales"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 resize-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Productos donados</label>
                    <span className="text-xs text-gray-400">{validItems.length} listo{validItems.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {items.map((item, i) => (
                      <ItemRow key={i} idx={i} item={item} productos={productos}
                        onChange={changeItem} onRemove={removeItem} canRemove={items.length > 1} />
                    ))}
                  </div>
                  <button type="button" onClick={() => setItems(p => [...p, { ...BLANK_ITEM }])}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-[#1B3078] font-medium border-2 border-dashed border-[#1B3078]/20 rounded-xl hover:border-[#1B3078]/40 hover:bg-[#EEF1FB] transition-colors">
                    <Plus size={15} /> Agregar otro producto
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">
                <p className="text-xs text-gray-400">
                  {validItems.length === 0 ? "Añade al menos un producto con cantidad"
                    : `${validItems.length} producto${validItems.length !== 1 ? "s" : ""} para registrar`}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} disabled={validItems.length === 0}>
                    Guardar donación
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
