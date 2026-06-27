"use client";
import { useState } from "react";
import { Search, Check, X } from "lucide-react";
import { PAISES } from "@/lib/paises";

// Selector múltiple de países con búsqueda y checkboxes
export function PaisesMultiSelect({ value, onChange }: {
  value: string[]; onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q ? PAISES.filter(p => p.toLowerCase().includes(q)) : PAISES;

  const toggle = (p: string) =>
    onChange(value.includes(p) ? value.filter(x => x !== p) : [...value, p]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Búsqueda */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]"
          />
        </div>
      </div>

      {/* Seleccionados (chips) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-100 bg-gray-50">
          {value.map(p => (
            <button type="button" key={p} onClick={() => toggle(p)}
              className="flex items-center gap-1 text-xs font-medium bg-[#1B3078] text-white pl-2 pr-1.5 py-1 rounded-full hover:bg-[#142360]">
              {p} <X size={11} />
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-5">Sin resultados para "{search}"</p>
        ) : (
          filtered.map(p => {
            const sel = value.includes(p);
            return (
              <button type="button" key={p} onClick={() => toggle(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left hover:bg-[#EEF1FB] transition-colors ${sel ? "text-[#1B3078] font-medium" : "text-gray-700"}`}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel ? "bg-[#1B3078] border-[#1B3078]" : "border-gray-300"}`}>
                  {sel && <Check size={11} className="text-white" />}
                </span>
                {p}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
