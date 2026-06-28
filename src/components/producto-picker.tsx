"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown, Check } from "lucide-react";

interface PickerProducto { id: string; nombre: string; categoria: { nombre: string } }

// Selector de producto con buscador en overlay (pantalla completa en móvil, diálogo en
// escritorio). Permite escribir y buscar; evita el auto-salto del <select> nativo.
export default function ProductoPicker({
  value, productos, onChange,
  placeholder = "Seleccionar producto...",
  invalid = false, size = "md", allowEmpty = false,
}: {
  value: string;
  productos: PickerProducto[];
  onChange: (id: string) => void;
  placeholder?: string;
  invalid?: boolean;
  size?: "sm" | "md";
  allowEmpty?: boolean;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected   = productos.find((p) => p.id === value);
  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria.nombre))].sort(), [productos]);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const q        = norm(search.trim());
  const filtered = q
    ? productos.filter((p) => norm(p.nombre).includes(q) || norm(p.categoria.nombre).includes(q))
    : productos;

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 60); }
    else { setSearch(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const pick = (id: string) => { onChange(id); setOpen(false); };

  const triggerCls =
    size === "sm"
      ? "w-full text-left text-xs rounded-lg px-2 py-1.5 bg-white flex items-center justify-between gap-1 active:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20"
      : "w-full text-left text-[15px] rounded-xl px-3 py-3 bg-white flex items-center justify-between gap-2 active:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";
  const borderCls = invalid ? "border border-amber-300" : "border border-gray-200";

  const overlay = open ? (
    <div className="fixed inset-0 z-[120] flex flex-col bg-white sm:items-center sm:justify-center sm:bg-black/40 sm:p-4">
      <div className="flex flex-col w-full h-full bg-white overflow-hidden sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl sm:shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-3 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]" />
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {allowEmpty && (
            <button type="button" onClick={() => pick("")}
              className={`w-full text-left px-4 py-3 text-[15px] italic border-b border-gray-50 active:bg-gray-100 ${!value ? "bg-gray-50 text-gray-600 font-medium" : "text-gray-400"}`}>
              — Sin asociar —
            </button>
          )}
          {q ? (
            filtered.length === 0
              ? <p className="text-sm text-gray-400 text-center py-10">Sin resultados para "{search}"</p>
              : filtered.map((p) => (
                <button key={p.id} type="button" onClick={() => pick(p.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 border-b border-gray-50 active:bg-[#EEF1FB] ${p.id === value ? "bg-[#EEF1FB]" : ""}`}>
                  <span className="text-[15px] text-gray-800">{p.nombre}</span>
                  <span className="text-xs text-gray-400 shrink-0">{p.categoria.nombre}</span>
                </button>
              ))
          ) : (
            categorias.map((cat) => {
              const prods = filtered.filter((p) => p.categoria.nombre === cat);
              if (!prods.length) return null;
              return (
                <div key={cat}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2 bg-gray-50 sticky top-0">{cat}</p>
                  {prods.map((p) => (
                    <button key={p.id} type="button" onClick={() => pick(p.id)}
                      className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-2 border-b border-gray-50 active:bg-[#EEF1FB] ${p.id === value ? "bg-[#EEF1FB] text-[#1B3078] font-medium" : "text-gray-800"}`}>
                      <span className="text-[15px]">{p.nombre}</span>
                      {p.id === value && <Check size={16} className="text-[#1B3078] shrink-0" />}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-w-0">
      <button type="button" onClick={() => setOpen(true)} className={`${triggerCls} ${borderCls}`}>
        <span className={`truncate ${selected ? "text-gray-900" : invalid ? "text-amber-700" : "text-gray-400"}`}>
          {selected ? selected.nombre : placeholder}
        </span>
        <ChevronDown size={size === "sm" ? 14 : 16} className="text-gray-400 shrink-0" />
      </button>
      {typeof document !== "undefined" && overlay ? createPortal(overlay, document.body) : null}
    </div>
  );
}
