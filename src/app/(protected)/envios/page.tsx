"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { puedeEnvios } from "@/lib/permisos";
import {
  Plus, Truck, Package, X, Search, ChevronDown, Trash2, Eye,
  MapPin, User, Calendar, FileText, Upload, Loader2, Image as ImageIcon,
  Boxes, Weight, Hash, Phone, Building2, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// ── constantes ────────────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "PREPARANDO",  label: "Preparando" },
  { value: "EN_TRANSITO", label: "En tránsito" },
  { value: "ENTREGADO",   label: "Entregado" },
];
const ESTADO_BADGE: Record<string, "warning" | "info" | "success"> = {
  PREPARANDO: "warning", EN_TRANSITO: "info", ENTREGADO: "success",
};
const ESTADO_LABEL: Record<string, string> = {
  PREPARANDO: "Preparando", EN_TRANSITO: "En tránsito", ENTREGADO: "Entregado",
};
const TIPOS_TRANSPORTE = ["Terrestre", "Marítimo", "Aéreo", "Mixto"];

function unidadLabel(u?: string) {
  const map: Record<string, string> = { KG: "kg", LITROS: "L", UNIDADES: "u" };
  return map[u ?? ""] ?? (u ?? "").toLowerCase();
}
function smartNum(n: number) {
  if (n === 0) return "0";
  return n % 1 === 0 ? String(n) : parseFloat(n.toFixed(3)).toString();
}
function fmtFecha(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

// ── tipos ─────────────────────────────────────────────────────────────────────
interface Producto { id: string; nombre: string; unidad: string; categoria: { nombre: string } }
interface ItemForm { productoId: string; cantidad: number }
interface EnvioItem { id: string; cantidad: number; producto: { nombre: string; unidad: string; categoria: { nombre: string } } }
interface Envio {
  id: string; destino: string; estado: string; notas?: string | null;
  organizacionReceptora?: string | null; contactoReceptor?: string | null;
  transportista?: string | null; tipoTransporte?: string | null; numeroGuia?: string | null;
  placaContenedor?: string | null; conductor?: string | null; contactoConductor?: string | null;
  fechaEnvio?: string | null; fechaEstimada?: string | null; fechaEntrega?: string | null;
  pesoTotal?: number | null; numeroBultos?: number | null;
  creadoEn: string;
  centroAcopio: {
    nombre: string; ciudad: string; pais?: string; direccion?: string | null;
    responsable?: string | null; telefono?: string | null; whatsapp?: string | null; email?: string | null;
  };
  items: EnvioItem[];
  fotos?: { id: string; url: string; descripcion?: string | null }[];
}

const BLANK_ITEM: ItemForm = { productoId: "", cantidad: 0 };

// ── ProductoCombobox (igual al de donaciones) ──────────────────────────────────
function ProductoCombobox({ value, productos, onChange }: {
  value: string; productos: Producto[]; onChange: (id: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
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
          {selected ? selected.nombre : "Seleccionar producto..."}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

// ── Campo de texto reutilizable ─────────────────────────────────────────────────
function Field({ label, children, opcional = true }: { label: string; children: React.ReactNode; opcional?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {opcional && <span className="text-gray-400">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}
const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";

// ── Generación de PDF (impresión nativa del navegador) ──────────────────────────
function esc(v: any): string {
  if (v == null || v === "") return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generarGuiaPDF(envio: Envio) {
  const c = envio.centroAcopio;
  const folio = envio.id.slice(-8).toUpperCase();
  const hoy = new Date().toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" });
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logoUrl = `${origin}/Operacion_transparente.svg`;

  // Fila de detalle "etiqueta: valor" solo si hay valor
  const row = (label: string, value: any) =>
    value ? `<tr><td class="lbl">${esc(label)}</td><td class="val">${esc(value)}</td></tr>` : "";

  // Productos agrupados por categoría
  const byCat: Record<string, EnvioItem[]> = {};
  for (const it of envio.items) (byCat[it.producto.categoria.nombre] ||= []).push(it);
  const productosRows = envio.items.length === 0
    ? `<tr><td colspan="3" class="empty">Sin productos registrados</td></tr>`
    : Object.entries(byCat).map(([cat, its]) => `
        <tr class="cat"><td colspan="3">${esc(cat)}</td></tr>
        ${its.map(it => `
          <tr>
            <td>${esc(it.producto.nombre)}</td>
            <td class="r">${smartNum(it.cantidad)} ${esc(unidadLabel(it.producto.unidad))}</td>
          </tr>`).join("")}
      `).join("");

  const fotosHtml = envio.fotos && envio.fotos.length > 0
    ? `<div class="section">
         <h2>Evidencia fotográfica</h2>
         <div class="fotos">
           ${envio.fotos.map(f => `<img src="${esc(f.url)}" />`).join("")}
         </div>
       </div>`
    : "";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<title>Guía de envío ${esc(folio)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; margin: 0; padding: 32px; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1B3078; padding-bottom: 14px; margin-bottom: 18px; }
  .head .brand { display:flex; align-items:center; gap:14px; }
  .head .logo { height: 56px; width: auto; }
  .head h1 { color: #1B3078; font-size: 22px; margin: 0 0 4px; letter-spacing: .5px; }
  .head .sub { color: #00A8E8; font-size: 11px; font-weight: 600; }
  .head .folio { text-align: right; font-size: 11px; color: #6b7280; }
  .head .folio b { display:block; color:#1B3078; font-size: 15px; letter-spacing:1px; }
  .estado { display:inline-block; margin-top:6px; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .e-PREPARANDO { background:#FEF3C7; color:#92400E; }
  .e-EN_TRANSITO { background:#DBEAFE; color:#1E40AF; }
  .e-ENTREGADO { background:#D1FAE5; color:#065F46; }
  .grid { display:flex; gap:18px; margin-bottom:18px; }
  .section { flex:1; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color:#1B3078; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin:0 0 8px; }
  table { width:100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  td.lbl { color:#6b7280; width: 42%; padding-right: 8px; }
  td.val { color:#111827; font-weight:600; }
  .prod { margin-bottom:18px; }
  .prod table td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
  .prod td.r { text-align:right; font-weight:700; color:#1B3078; white-space:nowrap; width: 30%; }
  .prod tr.cat td { background:#F3F4F6; font-weight:700; text-transform:uppercase; font-size:10px; letter-spacing:.5px; color:#374151; border:none; }
  .prod td.empty { text-align:center; color:#9ca3af; padding:14px; }
  .notas { background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:10px 12px; margin-bottom:18px; }
  .notas .t { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#92400E; font-weight:700; margin-bottom:3px; }
  .fotos { display:flex; flex-wrap:wrap; gap:8px; }
  .fotos img { width: 150px; height: 150px; object-fit: cover; border-radius:8px; border:1px solid #e5e7eb; }
  .foot { margin-top:24px; border-top:1px solid #e5e7eb; padding-top:10px; color:#9ca3af; font-size:10px; display:flex; justify-content:space-between; }
  @media print { body { padding: 0; } .section, .prod, .fotos img { break-inside: avoid; } }
</style></head>
<body>
  <div class="head">
    <div class="brand">
      <img class="logo" src="${esc(logoUrl)}" alt="Operación Todos con Venezuela" />
      <div>
        <h1>Guía de Envío</h1>
        <div class="sub">Operación Todos con Venezuela</div>
        <span class="estado e-${esc(envio.estado)}">${esc(ESTADO_LABEL[envio.estado] || envio.estado)}</span>
      </div>
    </div>
    <div class="folio">
      Folio<b>${esc(folio)}</b>
      Emitido: ${esc(hoy)}
    </div>
  </div>

  <div class="grid">
    <div class="section">
      <h2>Centro de origen</h2>
      <table>
        ${row("Centro", c.nombre)}
        ${row("Responsable", c.responsable)}
        ${row("Dirección", c.direccion)}
        ${row("Ciudad / País", [c.ciudad, c.pais].filter(Boolean).join(", "))}
        ${row("Teléfono", c.telefono)}
        ${row("WhatsApp", c.whatsapp)}
        ${row("Email", c.email)}
      </table>
    </div>
    <div class="section">
      <h2>Destino y receptor</h2>
      <table>
        ${row("Destino", envio.destino)}
        ${row("Organización / receptor", envio.organizacionReceptora)}
        ${row("Contacto receptor", envio.contactoReceptor)}
      </table>
    </div>
  </div>

  <div class="grid">
    <div class="section">
      <h2>Transporte</h2>
      <table>
        ${row("Transportista", envio.transportista)}
        ${row("Tipo de transporte", envio.tipoTransporte)}
        ${row("N° guía / tracking", envio.numeroGuia)}
        ${row("Placa / contenedor", envio.placaContenedor)}
        ${row("Conductor", envio.conductor)}
        ${row("Contacto conductor", envio.contactoConductor)}
      </table>
    </div>
    <div class="section">
      <h2>Fechas y carga</h2>
      <table>
        ${row("Fecha de despacho", fmtFecha(envio.fechaEnvio))}
        ${row("Entrega estimada", fmtFecha(envio.fechaEstimada))}
        ${row("Fecha de entrega", fmtFecha(envio.fechaEntrega))}
        ${row("Peso total", envio.pesoTotal != null ? smartNum(envio.pesoTotal) + " kg" : "")}
        ${row("Bultos / cajas", envio.numeroBultos)}
      </table>
    </div>
  </div>

  <div class="prod">
    <h2>Productos enviados</h2>
    <table>${productosRows}</table>
  </div>

  ${envio.notas ? `<div class="notas"><div class="t">Notas</div>${esc(envio.notas)}</div>` : ""}

  ${fotosHtml}

  <div class="foot">
    <span>Documento generado el ${esc(hoy)}</span>
    <span>${esc(c.nombre)} · ${esc([c.ciudad, c.pais].filter(Boolean).join(", "))}</span>
  </div>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Permite las ventanas emergentes para descargar el PDF."); return; }
  w.document.write(html);
  w.document.close();
  // Esperar a que carguen las imágenes antes de imprimir
  w.onload = () => { w.focus(); setTimeout(() => w.print(), 300); };
}

// ── Detalle de envío ────────────────────────────────────────────────────────────
function EnvioDetail({ envio, onClose, onPhotosChanged }: {
  envio: Envio; onClose: () => void; onPhotosChanged: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const byCategoria = useMemo(() => {
    const map: Record<string, EnvioItem[]> = {};
    for (const it of envio.items) {
      const c = it.producto.categoria.nombre;
      (map[c] ||= []).push(it);
    }
    return map;
  }, [envio.items]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("envioId", envio.id);
      fd.append("descripcion", "");
      await fetch("/api/fotos", { method: "POST", body: fd });
    }
    setUploading(false);
    onPhotosChanged();
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );

  const hayTransporte = envio.transportista || envio.tipoTransporte || envio.numeroGuia || envio.placaContenedor || envio.conductor;
  const hayReceptor   = envio.organizacionReceptora || envio.contactoReceptor;
  const hayFechas     = envio.fechaEnvio || envio.fechaEstimada || envio.fechaEntrega;
  const hayCarga      = envio.pesoTotal != null || envio.numeroBultos != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detalle de envío</p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-2 flex-wrap">
              {envio.centroAcopio.nombre} <span className="text-gray-300">→</span> {envio.destino}
              <Badge variant={ESTADO_BADGE[envio.estado]}>{ESTADO_LABEL[envio.estado]}</Badge>
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0 mt-0.5"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Receptor */}
          {hayReceptor && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Receptor en destino</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {envio.organizacionReceptora && <Row icon={<Building2 size={15} className="text-[#1B3078]" />} label="Organización / persona" value={envio.organizacionReceptora} />}
                {envio.contactoReceptor && <Row icon={<Phone size={15} className="text-[#1B3078]" />} label="Contacto" value={envio.contactoReceptor} />}
              </div>
            </div>
          )}

          {/* Transporte */}
          {hayTransporte && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Transporte</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {envio.transportista && <Row icon={<Truck size={15} className="text-[#1B3078]" />} label="Transportista" value={envio.transportista} />}
                {envio.tipoTransporte && <Row icon={<Truck size={15} className="text-[#1B3078]" />} label="Tipo" value={envio.tipoTransporte} />}
                {envio.numeroGuia && <Row icon={<FileText size={15} className="text-[#1B3078]" />} label="N° de guía / tracking" value={envio.numeroGuia} />}
                {envio.placaContenedor && <Row icon={<Boxes size={15} className="text-[#1B3078]" />} label="Placa / contenedor" value={envio.placaContenedor} />}
                {envio.conductor && <Row icon={<User size={15} className="text-[#1B3078]" />} label="Conductor" value={envio.conductor} />}
                {envio.contactoConductor && <Row icon={<Phone size={15} className="text-[#1B3078]" />} label="Contacto conductor" value={envio.contactoConductor} />}
              </div>
            </div>
          )}

          {/* Fechas y carga */}
          {(hayFechas || hayCarga) && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Fechas y carga</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {envio.fechaEnvio && <Row icon={<Calendar size={15} className="text-[#1B3078]" />} label="Despacho" value={fmtFecha(envio.fechaEnvio)} />}
                {envio.fechaEstimada && <Row icon={<Calendar size={15} className="text-[#1B3078]" />} label="Entrega estimada" value={fmtFecha(envio.fechaEstimada)} />}
                {envio.fechaEntrega && <Row icon={<Calendar size={15} className="text-[#1B3078]" />} label="Entregado el" value={fmtFecha(envio.fechaEntrega)} />}
                {envio.pesoTotal != null && <Row icon={<Weight size={15} className="text-[#1B3078]" />} label="Peso total" value={`${smartNum(envio.pesoTotal)} kg`} />}
                {envio.numeroBultos != null && <Row icon={<Boxes size={15} className="text-[#1B3078]" />} label="Bultos / cajas" value={envio.numeroBultos} />}
              </div>
            </div>
          )}

          {/* Notas */}
          {envio.notas && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Notas</p>
                <p className="text-sm text-gray-700 leading-relaxed">{envio.notas}</p>
              </div>
            </div>
          )}

          {/* Productos */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Productos enviados</p>
            {envio.items.length === 0 ? (
              <p className="text-sm text-gray-400">No se registraron productos en este envío.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byCategoria).map(([cat, its]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">{cat}</p>
                    <div className="space-y-1.5">
                      {its.map(it => (
                        <div key={it.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                          <p className="text-sm font-medium text-gray-800">{it.producto.nombre}</p>
                          <span className="text-sm font-bold text-[#1B3078] whitespace-nowrap shrink-0">
                            {smartNum(it.cantidad)} {unidadLabel(it.producto.unidad)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fotos / evidencia */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evidencia fotográfica</p>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-[#1B3078] hover:underline disabled:opacity-50">
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? "Subiendo..." : "Agregar fotos"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)} />
            </div>
            {envio.fotos && envio.fotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {envio.fotos.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                    <img src={f.url} alt={f.descripcion || "evidencia"} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm cursor-pointer hover:border-[#1B3078]/30"
                onClick={() => fileRef.current?.click()}>
                <ImageIcon size={28} className="mx-auto mb-2 opacity-40" />
                Sin fotos. Click para agregar evidencia del envío.
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cerrar</Button>
          <Button className="flex-1" onClick={() => generarGuiaPDF(envio)}>
            <FileDown size={15} className="mr-1.5" /> Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────────
export default function EnviosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSuperAdmin = session?.user?.rol === "SUPERADMIN";

  // Solo responsable (ADMIN) y superadmin acceden a Envíos
  useEffect(() => {
    if (status === "authenticated" && !puedeEnvios(session?.user?.rol)) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const [envios, setEnvios]       = useState<Envio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [centros, setCentros]     = useState<{ id: string; nombre: string; ciudad: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Envio | null>(null);

  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    destino: "", estado: "PREPARANDO", centroAcopioId: "",
    organizacionReceptora: "", contactoReceptor: "",
    transportista: "", tipoTransporte: "", numeroGuia: "", placaContenedor: "", conductor: "", contactoConductor: "",
    fechaEnvio: "", fechaEstimada: "", fechaEntrega: "",
    pesoTotal: "", numeroBultos: "", notas: "",
  });
  const [items, setItems] = useState<ItemForm[]>([{ ...BLANK_ITEM }]);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    const fetches: Promise<any>[] = [
      fetch("/api/envios").then(r => r.json()),
      fetch("/api/productos").then(r => r.json()),
    ];
    if (isSuperAdmin) fetches.push(fetch("/api/centros").then(r => r.json()));
    Promise.all(fetches).then(([env, prod, cent]) => {
      if (Array.isArray(env)) setEnvios(env);
      if (Array.isArray(prod)) setProductos(prod);
      if (Array.isArray(cent)) setCentros(cent);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [isSuperAdmin]);

  // Mantener el detalle sincronizado tras subir fotos
  useEffect(() => {
    if (selected) {
      const fresh = envios.find(e => e.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [envios]); // eslint-disable-line

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const changeItem = (i: number, v: Partial<ItemForm>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...v } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const openModal = () => {
    setForm({
      destino: "", estado: "PREPARANDO", centroAcopioId: "",
      organizacionReceptora: "", contactoReceptor: "",
      transportista: "", tipoTransporte: "", numeroGuia: "", placaContenedor: "", conductor: "", contactoConductor: "",
      fechaEnvio: "", fechaEstimada: "", fechaEntrega: "",
      pesoTotal: "", numeroBultos: "", notas: "",
    });
    setItems([{ ...BLANK_ITEM }]);
    setFotoFiles([]);
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destino.trim()) return;
    setSaving(true);
    const validItems = items.filter(it => it.productoId && it.cantidad > 0);
    const res = await fetch("/api/envios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        centroAcopioId: form.centroAcopioId || session?.user?.centroAcopioId,
        items: validItems,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      // Subir fotos al envío recién creado
      for (const file of fotoFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("envioId", nuevo.id);
        fd.append("descripcion", "");
        await fetch("/api/fotos", { method: "POST", body: fd });
      }
      setModal(false);
      load();
    }
    setSaving(false);
  };

  const validCount = items.filter(it => it.productoId && it.cantidad > 0).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
            <Truck size={20} className="text-[#1B3078]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Envíos</h1>
            <p className="text-gray-500 text-sm">{envios.length} registrados</p>
          </div>
        </div>
        <Button onClick={openModal} className="sm:ml-auto">
          <Plus size={15} className="mr-1.5" /> Nuevo envío
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
        </div>
      ) : envios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Truck size={40} className="opacity-30" />
            <p className="text-sm">No hay envíos registrados aún</p>
            <Button onClick={openModal}><Plus size={15} className="mr-1.5" /> Registrar primer envío</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {envios.map(envio => (
            <Card key={envio.id} className="hover:shadow-md hover:border-[#1B3078]/20 transition-all cursor-pointer"
              onClick={() => setSelected(envio)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
                      <Truck size={18} className="text-[#1B3078]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{envio.destino}</p>
                      <p className="text-xs text-gray-400 truncate">desde {envio.centroAcopio.nombre}</p>
                    </div>
                  </div>
                  <Badge variant={ESTADO_BADGE[envio.estado]}>{ESTADO_LABEL[envio.estado]}</Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Package size={12} /> {envio.items.length} productos</span>
                  {envio.numeroBultos != null && <span className="flex items-center gap-1"><Boxes size={12} /> {envio.numeroBultos} bultos</span>}
                  {envio.fotos && envio.fotos.length > 0 && <span className="flex items-center gap-1"><ImageIcon size={12} /> {envio.fotos.length}</span>}
                  <span className="flex items-center gap-1 ml-auto"><Calendar size={12} /> {formatDate(envio.creadoEn)}</span>
                </div>

                {envio.transportista && (
                  <p className="text-xs text-gray-400 mt-2 truncate">Transporte: {envio.transportista}{envio.tipoTransporte ? ` · ${envio.tipoTransporte}` : ""}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <EnvioDetail envio={selected} onClose={() => setSelected(null)} onPhotosChanged={load} />
      )}

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">Registrar envío</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

                {/* General */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Destino y estado</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Ciudad / estado de destino" opcional={false}>
                      <input type="text" value={form.destino} onChange={e => setF("destino", e.target.value)}
                        placeholder="Ej: Caracas, Venezuela" className={inputCls} required />
                    </Field>
                    <Field label="Estado del envío" opcional={false}>
                      <select value={form.estado} onChange={e => setF("estado", e.target.value)} className={inputCls + " bg-white"}>
                        {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  {isSuperAdmin && centros.length > 0 && (
                    <Field label="Centro de origen" opcional={false}>
                      <select value={form.centroAcopioId} onChange={e => setF("centroAcopioId", e.target.value)} required className={inputCls + " bg-white"}>
                        <option value="">Seleccionar centro...</option>
                        {centros.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</option>)}
                      </select>
                    </Field>
                  )}
                </div>

                {/* Receptor */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Receptor en destino</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Organización / persona que recibe">
                      <input type="text" value={form.organizacionReceptora} onChange={e => setF("organizacionReceptora", e.target.value)}
                        placeholder="Ej: Cruz Roja Venezuela" className={inputCls} />
                    </Field>
                    <Field label="Contacto del receptor">
                      <input type="text" value={form.contactoReceptor} onChange={e => setF("contactoReceptor", e.target.value)}
                        placeholder="Teléfono o email" className={inputCls} />
                    </Field>
                  </div>
                </div>

                {/* Transporte */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Transporte</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Transportista / empresa">
                      <input type="text" value={form.transportista} onChange={e => setF("transportista", e.target.value)}
                        placeholder="Empresa de transporte" className={inputCls} />
                    </Field>
                    <Field label="Tipo de transporte">
                      <select value={form.tipoTransporte} onChange={e => setF("tipoTransporte", e.target.value)} className={inputCls + " bg-white"}>
                        <option value="">Sin especificar</option>
                        {TIPOS_TRANSPORTE.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="N° de guía / tracking">
                      <input type="text" value={form.numeroGuia} onChange={e => setF("numeroGuia", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Placa / contenedor">
                      <input type="text" value={form.placaContenedor} onChange={e => setF("placaContenedor", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Conductor">
                      <input type="text" value={form.conductor} onChange={e => setF("conductor", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Contacto del conductor">
                      <input type="text" value={form.contactoConductor} onChange={e => setF("contactoConductor", e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                </div>

                {/* Fechas y carga */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Fechas y carga</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Fecha de despacho">
                      <input type="date" value={form.fechaEnvio} onChange={e => setF("fechaEnvio", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Entrega estimada">
                      <input type="date" value={form.fechaEstimada} onChange={e => setF("fechaEstimada", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Fecha de entrega">
                      <input type="date" value={form.fechaEntrega} onChange={e => setF("fechaEntrega", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Peso total (kg)">
                      <input type="number" min="0" step="0.1" value={form.pesoTotal} onChange={e => setF("pesoTotal", e.target.value)} placeholder="0" className={inputCls} />
                    </Field>
                    <Field label="N° de bultos / cajas">
                      <input type="number" min="0" step="1" value={form.numeroBultos} onChange={e => setF("numeroBultos", e.target.value)} placeholder="0" className={inputCls} />
                    </Field>
                  </div>
                </div>

                {/* Productos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Productos enviados</p>
                    <span className="text-xs text-gray-400">{validCount} listo{validCount !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 -mt-1">Lo que envíes se descuenta del inventario del centro.</p>
                  <div className="space-y-2">
                    {items.map((item, i) => {
                      const prod = productos.find(p => p.id === item.productoId);
                      return (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-2 items-center">
                          <ProductoCombobox value={item.productoId} productos={productos}
                            onChange={id => changeItem(i, { productoId: id, cantidad: 0 })} />
                          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shrink-0">
                            <input type="number" min="0" step={prod?.unidad === "UNIDADES" ? "1" : "0.1"}
                              value={item.cantidad || ""} onChange={e => changeItem(i, { cantidad: Number(e.target.value) })}
                              placeholder="0" className="w-16 text-sm text-center focus:outline-none bg-transparent font-medium" />
                            <span className="text-xs text-gray-500 font-medium w-6">{prod ? unidadLabel(prod.unidad) : ""}</span>
                          </div>
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setItems(p => [...p, { ...BLANK_ITEM }])}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#1B3078] font-medium border-2 border-dashed border-[#1B3078]/20 rounded-xl hover:border-[#1B3078]/40 hover:bg-[#EEF1FB] transition-colors">
                    <Plus size={15} /> Agregar producto
                  </button>
                </div>

                {/* Fotos */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Evidencia fotográfica</p>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#1B3078]/30 transition-colors"
                    onClick={() => fileRef.current?.click()}>
                    <Upload size={26} className="mx-auto text-gray-400 mb-1.5" />
                    <p className="text-sm text-gray-500">Click para agregar fotos del envío</p>
                    <p className="text-xs text-gray-400">Carga, cargue, entrega… (opcional)</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => setFotoFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                  {fotoFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {fotoFiles.map((f, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFotoFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notas */}
                <Field label="Notas / observaciones">
                  <textarea value={form.notas} onChange={e => setF("notas", e.target.value)} rows={2}
                    placeholder="Información adicional del envío" className={inputCls + " resize-none"} />
                </Field>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">
                <p className="text-xs text-gray-400">
                  {form.destino.trim() ? `Destino: ${form.destino}` : "Indica al menos el destino"}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} disabled={!form.destino.trim()}>Crear envío</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
