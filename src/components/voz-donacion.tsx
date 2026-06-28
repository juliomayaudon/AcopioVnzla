"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, CheckCircle2, AlertCircle } from "lucide-react";

interface Prod { id: string; nombre: string; unidad: string }
export interface VozItem {
  productoId: string; cantidad: number; cantidadUnidades: number;
  tamanoUnidad: number; desglose: boolean; notas: string;
}

// ── Helpers de parseo ────────────────────────────────────────────────────────
const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

const UNI: Record<string, number> = {
  cero:0, un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9,
  diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19,
  veinte:20, veintiuno:21, veintidos:22, veintitres:23, veinticuatro:24, veinticinco:25, veintiseis:26, veintisiete:27, veintiocho:28, veintinueve:29,
};
const DEC: Record<string, number> = { treinta:30, cuarenta:40, cincuenta:50, sesenta:60, setenta:70, ochenta:80, noventa:90 };
const CEN: Record<string, number> = { cien:100, ciento:100, doscientos:200, trescientos:300, cuatrocientos:400, quinientos:500, seiscientos:600, setecientos:700, ochocientos:800, novecientos:900 };
const esNumPalabra = (w: string) => UNI[w] != null || DEC[w] != null || CEN[w] != null;
const valorGrupo = (ts: string[]) => ts.reduce((a, t) => a + (CEN[t] ?? DEC[t] ?? UNI[t] ?? 0), 0);

// Convierte palabras-número del español a dígitos: "cuatro kilos" -> "4 kilos", "medio" -> "0.5"
function convertirNumeros(texto: string): string {
  const w = texto.split(/\s+/);
  const out: string[] = [];
  let i = 0;
  while (i < w.length) {
    if (esNumPalabra(w[i]) || w[i] === "mil") {
      const run: string[] = [];
      while (i < w.length && (esNumPalabra(w[i]) || w[i] === "y" || w[i] === "mil")) { run.push(w[i]); i++; }
      let mil = 0, grupo: string[] = [];
      for (const t of run) {
        if (t === "y") continue;
        if (t === "mil") { mil += (valorGrupo(grupo) || 1) * 1000; grupo = []; }
        else grupo.push(t);
      }
      let val = mil + valorGrupo(grupo);
      if (w[i] === "y" && (w[i + 1] === "medio" || w[i + 1] === "media")) { val += 0.5; i += 2; }
      out.push(String(val));
    } else if (w[i] === "medio" || w[i] === "media") { out.push("0.5"); i++; }
    else { out.push(w[i]); i++; }
  }
  return out.join(" ");
}

const PESO: Record<string, number> = {
  kilogramo:1, kilogramos:1, kilo:1, kilos:1, kg:1,
  gramo:0.001, gramos:0.001, gr:0.001, grs:0.001, g:0.001,
  mililitro:0.001, mililitros:0.001, ml:0.001, cc:0.001,
  litro:1, litros:1, lt:1, lts:1, l:1,
};
const CONTADOR = /^(unidad|unidades|lata|latas|paquete|paquetes|caja|cajas|bolsa|bolsas|botella|botellas|saco|sacos|funda|fundas|pieza|piezas)$/;
const FILLER = new Set(["de", "del", "la", "el", "los", "las", "y", "con"]);
const esUnidad = (u: string) => PESO[u] != null || CONTADOR.test(u);

function fuzzyProducto(texto: string, productos: Prod[]): Prod | null {
  const t = norm(texto);
  if (!t) return null;
  let p = productos.find((x) => norm(x.nombre) === t);
  if (p) return p;
  p = productos.find((x) => norm(x.nombre).includes(t) || t.includes(norm(x.nombre)));
  if (p) return p;
  const tokens = t.split(/\s+/).filter((x) => x.length > 2);
  let best: Prod | null = null, score = 0;
  for (const x of productos) {
    const nx = norm(x.nombre);
    let s = 0;
    for (const tok of tokens) if (nx.includes(tok)) s++;
    if (s > score) { score = s; best = x; }
  }
  return score > 0 ? best : null;
}

export interface ParseResult {
  texto: string; matched: boolean; productoNombre: string;
  item: VozItem | null; resumen: string;
}

export function parseFrase(texto: string, productos: Prod[]): ParseResult {
  const original = texto.trim();
  const t = convertirNumeros(norm(original));

  // pares (número, unidad)
  const pares: { n: number; u: string }[] = [];
  const re = /(\d+(?:\.\d+)?)\s*([a-zñ]+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const n = parseFloat(m[1]);
    const u = m[2] && esUnidad(m[2]) ? m[2] : "";
    if (Number.isFinite(n)) pares.push({ n, u });
  }

  // producto = lo que queda al quitar números, unidades y palabras de relleno
  const prodText = t
    .replace(/\d+(?:\.\d+)?/g, " ")
    .split(/\s+/)
    .filter((x) => x && !FILLER.has(x) && !esUnidad(x))
    .join(" ")
    .trim();

  const prod = fuzzyProducto(prodText, productos);
  if (!prod || !prodText) {
    return { texto: original, matched: false, productoNombre: prodText, item: null, resumen: original };
  }

  const size = pares.find((p) => PESO[p.u] != null);
  const count = pares.find((p) => p.u === "" || CONTADOR.test(p.u));
  const esVolumen = prod.unidad === "KG" || prod.unidad === "LITROS";

  let cantidad = 0, cantidadUnidades = 0, tamanoUnidad = 0;
  if (size && count && esVolumen) {
    cantidadUnidades = count.n;
    tamanoUnidad = parseFloat((size.n * PESO[size.u]).toFixed(4));
    cantidad = parseFloat((cantidadUnidades * tamanoUnidad).toFixed(4));
  } else if (size) {
    cantidad = parseFloat((size.n * PESO[size.u]).toFixed(4));
  } else if (count) {
    cantidad = count.n;
  }

  const desglose = esVolumen && cantidadUnidades > 0 && tamanoUnidad > 0;
  const uLabel = prod.unidad === "KG" ? "kg" : prod.unidad === "LITROS" ? "L" : "u";
  const resumen = desglose
    ? `${cantidadUnidades} × ${tamanoUnidad} ${uLabel} ${prod.nombre}`
    : `${cantidad} ${uLabel} ${prod.nombre}`;

  return {
    texto: original, matched: true, productoNombre: prod.nombre,
    item: { productoId: prod.id, cantidad, cantidadUnidades, tamanoUnidad, desglose, notas: "" },
    resumen,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function VozDonacion({ productos, onAdd }: {
  productos: Prod[]; onAdd: (item: VozItem) => void;
}) {
  const [soportado, setSoportado] = useState(true);
  const [escuchando, setEscuchando] = useState(false);
  const [interim, setInterim] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const recRef = useRef<any>(null);
  const escuchandoRef = useRef(false);
  const prodRef = useRef(productos);
  useEffect(() => { prodRef.current = productos; }, [productos]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSoportado(false); return; }
    const rec = new SR();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let intTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const r = parseFrase(txt, prodRef.current);
          if (r.matched && r.item) {
            onAdd(r.item);
            setFeedback({ ok: true, msg: r.resumen });
          } else {
            setFeedback({ ok: false, msg: `No reconocí: "${r.texto}"` });
          }
        } else {
          intTxt += txt;
        }
      }
      setInterim(intTxt);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setFeedback({ ok: false, msg: "Permite el micrófono para usar esta función." });
        escuchandoRef.current = false;
        setEscuchando(false);
      }
    };
    rec.onend = () => {
      // En móvil se corta solo: si seguimos en modo escucha, reinicia
      if (escuchandoRef.current) { try { rec.start(); } catch {} }
      else setInterim("");
    };
    recRef.current = rec;
    return () => { escuchandoRef.current = false; try { rec.stop(); } catch {} };
  }, [onAdd]);

  const toggle = () => {
    if (!recRef.current) return;
    if (escuchando) {
      escuchandoRef.current = false;
      setEscuchando(false);
      try { recRef.current.stop(); } catch {}
      setInterim("");
    } else {
      setFeedback(null);
      escuchandoRef.current = true;
      setEscuchando(true);
      try { recRef.current.start(); } catch {}
    }
  };

  if (!soportado) return null;

  return (
    <div className="mb-2.5">
      <button type="button" onClick={toggle}
        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
          escuchando ? "bg-red-500 text-white animate-pulse" : "text-white"}`}
        style={escuchando ? undefined : { background: "linear-gradient(90deg, #1B3078 0%, #00A8E8 100%)" }}>
        {escuchando ? <><MicOff size={16} /> Detener dictado</> : <><Mic size={16} /> Dictar por voz</>}
      </button>

      {escuchando && (
        <div className="mt-1.5 text-center">
          <p className="text-[11px] text-gray-400">
            Di por ejemplo: <span className="text-gray-500">«4 kilos de arroz»</span> o <span className="text-gray-500">«2 latas de atún de 80 gramos»</span>
          </p>
          {interim && <p className="text-sm text-[#1B3078] font-medium mt-1 italic">“{interim}”</p>}
        </div>
      )}

      {feedback && (
        <div className={`mt-1.5 flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 ${
          feedback.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {feedback.ok ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />}
          <span>{feedback.ok ? `Agregado: ${feedback.msg}` : feedback.msg}</span>
        </div>
      )}
    </div>
  );
}
