"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown } from "lucide-react";

export interface ProductoOption {
  id: string;
  nombre: string;
  unidad: string;
  categoria: { nombre: string };
}

// Buscador de productos con barra de búsqueda, agrupado por categoría.
// Se renderiza con portal para no recortarse dentro de modales con overflow.
export function ProductoCombobox({ value, productos, onChange, placeholder = "Seleccionar producto..." }: {
  value: string;
  productos: ProductoOption[];
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });
  const btnRef   = useRef<HTMLButtonElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected   = productos.find(p => p.id === value);
  const categorias = useMemo(() => [...new Set(productos.map(p => p.categoria.nombre))].sort(), [productos]);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? productos.filter(p => p.nombre.toLowerCase().includes(q) || p.categoria.nombre.toLowerCase().includes(q))
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
          {selected ? selected.nombre : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
