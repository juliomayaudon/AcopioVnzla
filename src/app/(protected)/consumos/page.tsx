"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { puedeConsumos } from "@/lib/permisos";
import { Plus, ShoppingBag, User, Calendar, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductoCombobox } from "@/components/producto-combobox";
import { formatDate, formatNumber } from "@/lib/utils";

const unidadLabel = (u?: string) =>
  ({ KG: "kg", LITROS: "L", UNIDADES: "u" } as Record<string, string>)[u ?? ""] ?? (u ?? "").toLowerCase();

const MOTIVOS = [
  { value: "HIDRATACION_EQUIPO", label: "Hidratacion del equipo" },
  { value: "ALIMENTACION_EQUIPO", label: "Alimentacion del equipo" },
  { value: "BOTIQUIN_VOLUNTARIOS", label: "Botiquin de voluntarios" },
  { value: "MATERIALES_OPERACION", label: "Materiales de operacion" },
  { value: "OTRO", label: "Otro" },
];

const MOTIVO_COLOR: Record<string, "warning" | "info" | "default" | "danger" | "success"> = {
  HIDRATACION_EQUIPO: "info",
  ALIMENTACION_EQUIPO: "warning",
  BOTIQUIN_VOLUNTARIOS: "danger",
  MATERIALES_OPERACION: "default",
  OTRO: "default",
};

interface Consumo {
  id: string;
  motivo: string;
  descripcion?: string;
  creadoEn: string;
  centroAcopio: { nombre: string; ciudad: string };
  registradoPor?: { nombre: string };
  items: {
    id: string;
    cantidad: number;
    producto: { nombre: string; unidad: string; categoria: { nombre: string } };
  }[];
}

interface ItemForm { productoId: string; cantidad: number }

export default function ConsumosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const puedeRegistrar = puedeConsumos(session?.user?.rol);

  // Solo responsable (ADMIN) y superadmin acceden a Consumo Interno
  useEffect(() => {
    if (status === "authenticated" && !puedeConsumos(session?.user?.rol)) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ motivo: "HIDRATACION_EQUIPO", descripcion: "" });
  const [items, setItems] = useState<ItemForm[]>([{ productoId: "", cantidad: 1 }]);

  const load = () => {
    Promise.all([
      fetch("/api/consumos").then(r => r.json()),
      fetch("/api/productos").then(r => r.json()),
    ]).then(([c, p]) => {
      if (Array.isArray(c)) setConsumos(c);
      if (Array.isArray(p)) setProductos(p);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  function addItem() {
    setItems([...items, { productoId: "", cantidad: 1 }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ItemForm, value: string | number) {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter(it => it.productoId && it.cantidad > 0);
    if (validItems.length === 0) {
      setError("Añade al menos un producto con cantidad");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/consumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: validItems }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Error al registrar consumo");
        return;
      }
      setModal(false);
      setForm({ motivo: "HIDRATACION_EQUIPO", descripcion: "" });
      setItems([{ productoId: "", cantidad: 1 }]);
      setError("");
      load();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const totalItems = consumos.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.cantidad, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consumo Interno</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registro auditado de suministros usados por el equipo — {consumos.length} registros
          </p>
        </div>
        {puedeRegistrar && (
          <Button onClick={() => setModal(true)}>
            <Plus size={16} /> Registrar Consumo
          </Button>
        )}
      </div>

      {/* Aviso de transparencia */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Registro aparte de los suministros que usa el equipo. <strong>No se descuenta</strong> de
          las donaciones destinadas a Venezuela: es un ledger independiente para mantener transparencia.
          Solo el responsable del centro puede registrarlo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3078]" />
        </div>
      ) : consumos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500">No hay consumos internos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consumos.map((c) => {
            const motivoLabel = MOTIVOS.find(m => m.value === c.motivo)?.label || c.motivo;
            return (
              <Card key={c.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <ShoppingBag size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{motivoLabel}</p>
                      <p className="text-sm text-gray-500">{c.centroAcopio.nombre} · {c.centroAcopio.ciudad}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-700">{c.items.length} producto(s)</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                        <Calendar size={11} />
                        {formatDate(c.creadoEn)}
                      </div>
                    </div>
                    <Badge variant={MOTIVO_COLOR[c.motivo]}>{motivoLabel}</Badge>
                    {expandedId === c.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expandedId === c.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    {c.descripcion && (
                      <p className="text-sm text-gray-600 mb-3 italic">"{c.descripcion}"</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.producto.nombre}</p>
                            <p className="text-xs text-gray-400">{item.producto.categoria.nombre}</p>
                          </div>
                          <Badge variant="warning">{formatNumber(item.cantidad)} {item.producto.unidad}</Badge>
                        </div>
                      ))}
                    </div>
                    {c.registradoPor && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <User size={11} /> Registrado por {c.registradoPor.nombre}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setError(""); }} title="Registrar Consumo Interno" className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Motivo"
            value={form.motivo}
            onChange={e => setForm({ ...form, motivo: e.target.value })}
            options={MOTIVOS}
          />
          <Input
            label="Descripcion adicional (opcional)"
            placeholder="Ej: Agua para 15 voluntarios turno mañana"
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Productos usados</p>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus size={14} /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => {
                const prod = productos.find(p => p.id === item.productoId);
                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-2 items-center">
                    <ProductoCombobox
                      value={item.productoId}
                      productos={productos}
                      onChange={id => updateItem(i, "productoId", id)}
                    />
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shrink-0">
                      <input
                        type="number" min="0" step={prod?.unidad === "UNIDADES" ? "1" : "0.001"}
                        value={item.cantidad || ""}
                        onChange={e => updateItem(i, "cantidad", Number(e.target.value))}
                        placeholder="0"
                        className="w-16 text-sm text-center focus:outline-none bg-transparent font-medium"
                      />
                      <span className="text-xs text-gray-500 font-medium w-5">{prod ? unidadLabel(prod.unidad) : ""}</span>
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
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Registrar Consumo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
