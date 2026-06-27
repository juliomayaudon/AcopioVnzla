"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Control de paginación (el padre hace el slice de los datos)
export function Pagination({ page, pages, total, perPage, onChange, label = "registros" }: {
  page: number; pages: number; total: number; perPage: number;
  onChange: (p: number) => void; label?: string;
}) {
  if (pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 order-2 sm:order-1">
        Mostrando {from}–{to} de {total} {label}
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
