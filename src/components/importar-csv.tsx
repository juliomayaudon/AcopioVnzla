"use client";
import { useState, useMemo } from "react";
import {
  X, Upload, ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2,
  AlertTriangle, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Producto { id: string; nombre: string; unidad: string; categoria: { nombre: string } }
interface Centro { id: string; nombre: string; ciudad: string }

const CAMPOS = [
  { key: "producto",     label: "Producto",                req: true,  hint: "Nombre del producto donado" },
  { key: "cantidad",     label: "Cantidad",                req: true,  hint: "N° de envases o cantidad total" },
  { key: "peso",         label: "Peso/tamaño por unidad",  req: false, hint: "Opcional — kg o L de cada envase" },
  { key: "unidad",       label: "Unidad",                  req: false, hint: "Opcional — kg, litros, unidades" },
  { key: "fecha",        label: "Fecha/hora de ingreso",   req: false, hint: "Opcional — si falta se usa la fecha actual" },
  { key: "donante",      label: "Donante",                 req: false, hint: "Opcional" },
  { key: "nacionalidad", label: "Nacionalidad del donante", req: false, hint: "Opcional" },
  { key: "notas",        label: "Notas",                   req: false, hint: "Opcional" },
] as const;
type CampoKey = typeof CAMPOS[number]["key"];
type Mapping = Record<CampoKey, number>;

const GUESS: Record<CampoKey, string[]> = {
  producto:     ["producto", "articulo", "item", "descripcion", "insumo", "nombre"],
  cantidad:     ["cantidad", "cant", "qty", "unidades", "numero", "total"],
  peso:         ["peso", "tamano", "tamaño", "gramos", "kilos", "volumen", "ml", "litro", "presentacion"],
  unidad:       ["unidad", "medida", "um"],
  fecha:        ["fecha", "hora", "ingreso", "dia", "date"],
  donante:      ["donante", "donador", "persona", "institucion", "empresa", "quien"],
  nacionalidad: ["nacionalidad", "origen"],
  notas:        ["nota", "observ", "comentario", "obs"],
};

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

// ── Parsers ────────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  // Detecta separador (coma o punto y coma — Excel en español usa ;)
  const head = text.slice(0, text.indexOf("\n") >= 0 ? text.indexOf("\n") : text.length);
  const delim = head.split(";").length > head.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === delim) { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseNum(s: string): number {
  if (!s) return NaN;
  let t = String(s).trim().replace(/[^\d.,-]/g, "");
  if (!t) return NaN;
  if (t.includes(",") && t.includes(".")) {
    if (t.lastIndexOf(",") > t.lastIndexOf(".")) t = t.replace(/\./g, "").replace(",", ".");
    else t = t.replace(/,/g, "");
  } else if (t.includes(",")) {
    t = t.replace(",", ".");
  }
  return parseFloat(t);
}

function parseUnidad(s: string): string | null {
  const t = norm(s);
  if (!t) return null;
  if (/\b(kg|kilo|kilos|kilogramo|kilogramos)\b/.test(t) || t === "k") return "KG";
  if (/\b(l|lt|lts|litro|litros)\b/.test(t)) return "LITROS";
  if (/(unid|unidad|pieza|pza|paquete|caja|lata|bolsa|botella|saco|bulto)/.test(t)) return "UNIDADES";
  return null;
}

function parseFecha(s: string): string | null {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const dt = new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10), m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }
  const dt = new Date(t);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

// ── Componente ───────────────────────────────────────────────────────────────────
export default function ImportarCSV({
  productos, centros, conFiltros, onClose, onImported,
}: {
  productos: Producto[]; centros: Centro[]; conFiltros: boolean;
  onClose: () => void; onImported: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>(
    CAMPOS.reduce((a, c) => ({ ...a, [c.key]: -1 }), {} as Mapping)
  );
  const [centroId, setCentroId] = useState("");
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [aiMatches, setAiMatches] = useState<Record<string, string>>({});
  const [agrupar, setAgrupar] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");

  const productosPorCat = useMemo(() => {
    const map: Record<string, Producto[]> = {};
    for (const p of productos) (map[p.categoria.nombre] ||= []).push(p);
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [productos]);

  const fuzzy = useMemo(() => {
    return (texto: string): string => {
      const t = norm(texto);
      if (!t) return "";
      let p = productos.find((x) => norm(x.nombre) === t);
      if (p) return p.id;
      p = productos.find((x) => norm(x.nombre).includes(t) || t.includes(norm(x.nombre)));
      if (p) return p.id;
      const tokens = t.split(/\s+/).filter((w) => w.length > 2);
      let best = "", bestScore = 0;
      for (const x of productos) {
        const nx = norm(x.nombre);
        let score = 0;
        for (const tok of tokens) if (nx.includes(tok)) score++;
        if (score > bestScore) { bestScore = score; best = x.id; }
      }
      return bestScore > 0 ? best : "";
    };
  }, [productos]);

  const onFile = async (file: File) => {
    setError("");
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) { setError("El archivo no tiene filas de datos."); return; }
    const hs = rows[0].map((h) => h.trim());
    setHeaders(hs);
    setRawRows(rows.slice(1));
    setFileName(file.name);
    // Auto-adivinar mapeo
    const used = new Set<number>();
    const guess = { ...mapping };
    for (const campo of CAMPOS) {
      const idx = hs.findIndex(
        (h, i) => !used.has(i) && GUESS[campo.key].some((kw) => norm(h).includes(kw))
      );
      if (idx >= 0) { guess[campo.key] = idx; used.add(idx); }
    }
    setMapping(guess);
    if (conFiltros && centros.length === 1) setCentroId(centros[0].id);
    setStep(2);
  };

  const rows = useMemo(() => {
    if (mapping.producto < 0) return [];
    return rawRows.map((r, idx) => {
      const txt = (r[mapping.producto] ?? "").trim();
      const cant = parseNum(mapping.cantidad >= 0 ? r[mapping.cantidad] ?? "" : "");
      const peso = parseNum(mapping.peso >= 0 ? r[mapping.peso] ?? "" : "");
      const unidadStr = mapping.unidad >= 0 ? r[mapping.unidad] ?? "" : "";
      const fechaStr = mapping.fecha >= 0 ? r[mapping.fecha] ?? "" : "";
      const donante = mapping.donante >= 0 ? (r[mapping.donante] ?? "").trim() : "";
      const nac = mapping.nacionalidad >= 0 ? (r[mapping.nacionalidad] ?? "").trim() : "";
      const notas = mapping.notas >= 0 ? (r[mapping.notas] ?? "").trim() : "";

      const productoId = overrides[idx] ?? aiMatches[norm(txt)] ?? fuzzy(txt);
      const prod = productos.find((p) => p.id === productoId);
      const unidad = prod?.unidad || parseUnidad(unidadStr) || "UNIDADES";

      let cantidad = 0;
      let cantidadUnidades: number | null = null;
      if (unidad === "KG" || unidad === "LITROS") {
        if (Number.isFinite(peso) && peso > 0 && Number.isFinite(cant) && cant > 0) {
          cantidadUnidades = cant;
          cantidad = parseFloat((cant * peso).toFixed(4));
        } else if (Number.isFinite(cant) && cant > 0) {
          cantidad = cant;
        }
      } else if (Number.isFinite(cant) && cant > 0) {
        cantidad = cant;
      }

      const fechaISO = fechaStr ? parseFecha(fechaStr) : null;
      return {
        idx, txt, productoId, prod, unidad, cantidad, cantidadUnidades,
        donante, nac, notas, fechaISO, valida: !!productoId && cantidad > 0,
      };
    });
  }, [rawRows, mapping, overrides, aiMatches, fuzzy, productos]);

  const stats = useMemo(() => ({
    total: rows.length,
    validas: rows.filter((r) => r.valida).length,
    sinProducto: rows.filter((r) => !r.productoId).length,
    sinCantidad: rows.filter((r) => r.productoId && r.cantidad <= 0).length,
  }), [rows]);

  const puedeSiguiente =
    mapping.producto >= 0 && mapping.cantidad >= 0 && (!conFiltros || !!centroId);

  const asociarIA = async () => {
    const pendientes = [...new Set(rows.filter((r) => !r.productoId && r.txt).map((r) => r.txt))];
    if (!pendientes.length) return;
    setAiLoading(true); setError("");
    try {
      const res = await fetch("/api/productos/match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombres: pendientes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No se pudo usar la IA."); return; }
      const add: Record<string, string> = {};
      for (const [t, id] of Object.entries(data.matches || {})) if (id) add[norm(t)] = id as string;
      if (!Object.keys(add).length) setError("La IA no reconoció ninguno de los productos pendientes.");
      setAiMatches((prev) => ({ ...prev, ...add }));
    } catch {
      setError("No se pudo conectar con la IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const importar = async () => {
    const validas = rows.filter((r) => r.valida);
    if (!validas.length) return;
    setImporting(true); setError("");
    const donaciones = agrupar
      ? [{
          donante: validas.find((r) => r.donante)?.donante || undefined,
          items: validas.map((r) => ({
            productoId: r.productoId, cantidad: r.cantidad,
            cantidadUnidades: r.cantidadUnidades, notas: r.notas || undefined,
          })),
        }]
      : validas.map((r) => ({
          donante: r.donante || undefined,
          nacionalidadDonante: r.nac || undefined,
          notas: r.notas || undefined,
          creadoEn: r.fechaISO || undefined,
          items: [{ productoId: r.productoId, cantidad: r.cantidad, cantidadUnidades: r.cantidadUnidades }],
        }));
    try {
      const res = await fetch("/api/donaciones/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centroAcopioId: conFiltros ? centroId : undefined, donaciones }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No se pudo importar."); return; }
      setResult(data.creadas ?? validas.length);
      onImported();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setImporting(false);
    }
  };

  const setMap = (key: CampoKey, idx: number) => setMapping((m) => ({ ...m, [key]: idx }));
  const visibles = rows.slice(0, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center sm:justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full flex flex-col h-full sm:h-auto sm:max-w-3xl sm:max-h-[92vh] sm:rounded-2xl sm:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#1B3078]" />
            <h3 className="font-semibold text-gray-900">Importar donaciones desde CSV</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        {/* Pasos */}
        {result === null && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 shrink-0 text-xs">
            {[{ n: 1, t: "Subir" }, { n: 2, t: "Asociar columnas" }, { n: 3, t: "Revisar e importar" }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                  step >= s.n ? "bg-[#1B3078] text-white" : "bg-gray-100 text-gray-400"}`}>{s.n}</span>
                <span className={step >= s.n ? "text-gray-700 font-medium" : "text-gray-400"}>{s.t}</span>
                {i < 2 && <span className="text-gray-300 mx-1">→</span>}
              </div>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Resultado */}
          {result !== null ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">¡Importación lista!</h4>
              <p className="text-gray-500 text-sm">Se registraron <strong>{result}</strong> donación{result !== 1 ? "es" : ""}.</p>
            </div>
          ) : step === 1 ? (
            /* ── Paso 1: subir ── */
            <div className="py-6">
              <label className="block">
                <input type="file" accept=".csv,.txt,text/csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
                <div className="border-2 border-dashed border-gray-200 rounded-2xl py-12 px-6 text-center cursor-pointer hover:border-[#1B3078]/40 hover:bg-[#EEF1FB]/40 transition-colors">
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-700">Toca para elegir un archivo CSV</p>
                  <p className="text-xs text-gray-400 mt-1">o arrástralo aquí</p>
                </div>
              </label>
              <div className="mt-5 text-xs text-gray-500 bg-gray-50 rounded-xl p-4 space-y-1.5">
                <p className="font-semibold text-gray-600">¿Tienes un Excel?</p>
                <p>Ábrelo y usa <strong>Archivo → Guardar como → CSV</strong>. Luego súbelo aquí.</p>
                <p>La primera fila debe ser el encabezado (nombres de columna). Detectamos comas y punto y coma automáticamente.</p>
              </div>
            </div>
          ) : step === 2 ? (
            /* ── Paso 2: mapeo ── */
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Archivo <strong className="text-gray-700">{fileName}</strong> · {rawRows.length} filas.
                Indica qué columna corresponde a cada dato.
              </p>

              {conFiltros && centros.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Centro de acopio destino *</label>
                  <select value={centroId} onChange={(e) => setCentroId(e.target.value)}
                    className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200">
                    <option value="">Seleccionar centro...</option>
                    {centros.map((c) => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2.5">
                {CAMPOS.map((campo) => (
                  <div key={campo.key} className="flex items-center gap-3">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-gray-800">
                        {campo.label}{campo.req && <span className="text-red-500"> *</span>}
                      </p>
                      <p className="text-[11px] text-gray-400 leading-tight">{campo.hint}</p>
                    </div>
                    <select value={mapping[campo.key]} onChange={(e) => setMap(campo.key, parseInt(e.target.value))}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20">
                      <option value={-1}>— Sin asociar —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Paso 3: vista previa ── */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{stats.validas}</p>
                  <p className="text-[11px] text-green-600 font-medium">Listas para importar</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{stats.sinProducto}</p>
                  <p className="text-[11px] text-amber-600 font-medium">Sin producto asociado</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Filas totales</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {stats.sinProducto > 0 && (
                  <button type="button" onClick={asociarIA} disabled={aiLoading}
                    className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-3.5 py-2 transition-opacity hover:opacity-95 disabled:opacity-60"
                    style={{ background: "linear-gradient(90deg, #1B3078 0%, #00A8E8 100%)" }}>
                    {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    Asociar productos con IA
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto cursor-pointer">
                  <input type="checkbox" checked={agrupar} onChange={(e) => setAgrupar(e.target.checked)} className="accent-[#1B3078]" />
                  Agrupar todo en una sola donación
                </label>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="max-h-[45vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2 font-semibold">Texto del CSV</th>
                        <th className="px-3 py-2 font-semibold">Producto asociado</th>
                        <th className="px-3 py-2 font-semibold text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((r) => (
                        <tr key={r.idx} className={`border-t border-gray-50 ${!r.valida ? "bg-amber-50/40" : ""}`}>
                          <td className="px-3 py-2 align-top">
                            <span className="text-gray-700">{r.txt || <em className="text-gray-300">vacío</em>}</span>
                            {r.donante && <p className="text-[11px] text-gray-400">{r.donante}</p>}
                          </td>
                          <td className="px-3 py-2">
                            <select value={r.productoId}
                              onChange={(e) => setOverrides((o) => ({ ...o, [r.idx]: e.target.value }))}
                              className={`w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 ${
                                r.productoId ? "border-gray-200 text-gray-700" : "border-amber-300 text-amber-700"}`}>
                              <option value="">— sin asociar —</option>
                              {productosPorCat.map(([cat, prods]) => (
                                <optgroup key={cat} label={cat}>
                                  {prods.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap align-top">
                            {r.cantidad > 0 ? (
                              <span className="font-semibold text-gray-800">
                                {r.cantidad}{" "}
                                <span className="text-xs text-gray-400">
                                  {r.unidad === "KG" ? "kg" : r.unidad === "LITROS" ? "L" : "u"}
                                </span>
                              </span>
                            ) : <span className="text-amber-600 text-xs flex items-center gap-1 justify-end"><AlertTriangle size={12} /> sin cant.</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > visibles.length && (
                  <p className="text-[11px] text-gray-400 text-center py-2 bg-gray-50 border-t border-gray-100">
                    Mostrando {visibles.length} de {rows.length} filas (se importarán todas las válidas).
                  </p>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>}
        </div>

        {/* Footer */}
        {result === null && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3 shrink-0 bg-white">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="shrink-0">
                <ArrowLeft size={15} className="mr-1" /> Atrás
              </Button>
            )}
            {step === 2 && (
              <Button type="button" onClick={() => setStep(3)} disabled={!puedeSiguiente} className="flex-1">
                Siguiente <ArrowRight size={15} className="ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button type="button" onClick={importar} loading={importing} disabled={stats.validas === 0} className="flex-1">
                Importar {stats.validas} donación{stats.validas !== 1 ? "es" : ""}
              </Button>
            )}
          </div>
        )}
        {result !== null && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0 bg-white">
            <Button type="button" onClick={onClose} className="w-full">Listo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
