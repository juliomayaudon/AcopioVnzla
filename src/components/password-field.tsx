"use client";
import { useState } from "react";
import { Eye, EyeOff, RefreshCw, X, Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]";

// Genera una contraseña legible (sin caracteres ambiguos: O/0, I/l/1)
export function randomPassword(len = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// Campo de contraseña con "mostrar" y "generar"
export function PasswordField({ value, onChange, label = "Contraseña", required }: {
  value: string; onChange: (v: string) => void; label?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} {required && "*"}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={inputCls + " pr-9"}
            placeholder="Mínimo 6 caracteres"
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title={show ? "Ocultar" : "Mostrar"}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="button" onClick={() => { onChange(randomPassword()); setShow(true); }}
          className="flex items-center gap-1.5 text-xs font-medium text-[#1B3078] bg-[#EEF1FB] hover:bg-[#E0E6F8] px-3 rounded-lg transition-colors shrink-0">
          <RefreshCw size={13} /> Generar
        </button>
      </div>
    </div>
  );
}

// Modal para restablecer la contraseña de un usuario existente
export function ResetPasswordModal({ userId, userName, onClose }: {
  userId: string; userName: string; onClose: () => void;
}) {
  const [password, setPassword] = useState(() => randomPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/usuarios/${userId}/password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); setError(e.error || "No se pudo restablecer"); return; }
      setDone(true);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(password).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound size={16} className="text-[#1B3078]" /> Restablecer contraseña
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Define una nueva contraseña para <strong className="text-gray-800">{userName}</strong>.
            Compártela con la persona; podrá usarla para iniciar sesión.
          </p>

          {done ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <Check size={15} /> Contraseña actualizada
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Nueva contraseña</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-semibold text-gray-800 break-all">{password}</code>
                  <button onClick={copy} className="flex items-center gap-1 text-xs font-medium text-[#1B3078] hover:underline shrink-0">
                    <Copy size={13} /> {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={onClose}>Listo</Button>
            </div>
          ) : (
            <>
              <PasswordField value={password} onChange={setPassword} label="Nueva contraseña" required />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" loading={loading} onClick={submit}>Restablecer</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
