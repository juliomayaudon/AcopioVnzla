"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tags, Plus, X, ChevronDown, ChevronUp, Package, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";
const unidadLabel = (u?: string) =>
  ({ KG: "kg", LITROS: "L", UNIDADES: "unidades" } as Record<string, string>)[u ?? ""] ?? (u ?? "").toLowerCase();
const UNIDADES = [
  { value: "KG", label: "Kilogramos (peso)" },
  { value: "LITROS", label: "Litros (volumen)" },
  { value: "UNIDADES", label: "Unidades (se cuentan)" },
];

interface Categoria { id: string; nombre: string; descripcion?: string | null }
interface Producto { id: string; nombre: string; unidad: string; categoria: { id: string; nombre: string } }

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

// ── Form categoría ──────────────────────────────────────────────────────────────
function CategoriaForm({ onSave, onClose }: { onSave: (d: any) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <form onSubmit={async e => {
      e.preventDefault();
      if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
      setLoading(true); setError("");
      try { await onSave(form); onClose(); }
      catch (err: any) { setError(err.message || "Error al guardar"); }
      finally { setLoading(false); }
    }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la categoría *</label>
        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Alimento para mascotas" className={inputCls} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción <span className="text-gray-400">(opcional)</span></label>
        <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Breve descripción" className={inputCls} />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>Crear categoría</Button>
      </div>
    </form>
  );
}

// ── Form producto ─────────────────────────────────────────────────────────────
function ProductoForm({ categorias, categoriaInicial, onSave, onClose }: {
  categorias: Categoria[]; categoriaInicial?: string;
  onSave: (d: any) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({ nombre: "", categoriaId: categoriaInicial || "", unidad: "UNIDADES" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <form onSubmit={async e => {
      e.preventDefault();
      if (!form.nombre.trim() || !form.categoriaId) { setError("Nombre y categoría son requeridos"); return; }
      setLoading(true); setError("");
      try { await onSave(form); onClose(); }
      catch (err: any) { setError(err.message || "Error al guardar"); }
      finally { setLoading(false); }
    }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Categoría *</label>
        <select value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
          className={inputCls + " bg-white"} required>
          <option value="">Seleccionar categoría...</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del producto *</label>
        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Alimento para perros" className={inputCls} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Unidad de medida *</label>
        <select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
          className={inputCls + " bg-white"}>
          {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
        <p className="text-[11px] text-gray-400 mt-1">Define cómo se mide: peso (kg), volumen (L) o conteo (unidades).</p>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>Crear producto</Button>
      </div>
    </form>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalCat, setModalCat] = useState(false);
  const [modalProd, setModalProd] = useState<{ categoriaId?: string } | null>(null);

  const load = () => {
    Promise.all([
      fetch("/api/categorias").then(r => r.json()),
      fetch("/api/productos").then(r => r.json()),
    ]).then(([c, p]) => {
      if (Array.isArray(c)) setCategorias(c);
      if (Array.isArray(p)) setProductos(p);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/login"); return; }
    if (session!.user.rol !== "SUPERADMIN") { router.replace("/dashboard"); return; }
    load();
  }, [status]); // eslint-disable-line

  const crearCategoria = async (data: any) => {
    const r = await fetch("/api/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    load();
  };
  const crearProducto = async (data: any) => {
    const r = await fetch("/api/productos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    load();
  };

  const productosPorCat = useMemo(() => {
    const map: Record<string, Producto[]> = {};
    for (const p of productos) (map[p.categoria.id] ||= []).push(p);
    return map;
  }, [productos]);

  const q = busqueda.trim().toLowerCase();
  const categoriasFiltradas = q
    ? categorias.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (productosPorCat[c.id] || []).some(p => p.nombre.toLowerCase().includes(q)))
    : categorias;

  if (loading || status === "loading") return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
            <Tags size={20} className="text-[#1B3078]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categorías y productos</h1>
            <p className="text-gray-500 text-sm">{categorias.length} categorías · {productos.length} productos</p>
          </div>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setModalCat(true)}>
            <Plus size={15} className="mr-1.5" /> Nueva categoría
          </Button>
          <Button onClick={() => setModalProd({})}>
            <Plus size={15} className="mr-1.5" /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" placeholder="Buscar categoría o producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]" />
      </div>

      {/* Lista de categorías */}
      <div className="space-y-3">
        {categoriasFiltradas.map(cat => {
          const prods = productosPorCat[cat.id] || [];
          const isOpen = expanded === cat.id || !!q;
          return (
            <Card key={cat.id} className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen && !q ? null : cat.id)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{cat.nombre}</p>
                    <Badge variant="info">{prods.length} producto{prods.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  {cat.descripcion && <p className="text-xs text-gray-400 mt-0.5">{cat.descripcion}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button onClick={(e) => { e.stopPropagation(); setModalProd({ categoriaId: cat.id }); }}
                    title="Agregar producto a esta categoría"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#1B3078] hover:bg-[#EEF1FB] transition-colors">
                    <Plus size={16} />
                  </button>
                  {!q && (isOpen
                    ? <ChevronUp size={16} className="text-gray-400" />
                    : <ChevronDown size={16} className="text-gray-400" />)}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                  {prods.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Sin productos.{" "}
                      <button onClick={() => setModalProd({ categoriaId: cat.id })} className="text-[#1B3078] font-medium hover:underline">Agregar uno</button>
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {prods.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <span className="text-sm text-gray-800">{p.nombre}</span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5">{unidadLabel(p.unidad)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {categoriasFiltradas.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <Package size={40} className="opacity-30" />
              <p className="text-sm">{q ? "Sin resultados para la búsqueda" : "No hay categorías aún"}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {modalCat && (
        <Modal title="Nueva categoría" onClose={() => setModalCat(false)}>
          <CategoriaForm onSave={crearCategoria} onClose={() => setModalCat(false)} />
        </Modal>
      )}
      {modalProd && (
        <Modal title="Nuevo producto" onClose={() => setModalProd(null)}>
          <ProductoForm categorias={categorias} categoriaInicial={modalProd.categoriaId}
            onSave={crearProducto} onClose={() => setModalProd(null)} />
        </Modal>
      )}
    </div>
  );
}
