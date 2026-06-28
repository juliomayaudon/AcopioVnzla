"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#1B3078] p-12">
        <div>
          <img src="/Comando_Con_Venezuela_logo.svg" alt="Comando Con Venezuela" className="w-56 brightness-0 invert" />
        </div>
        <div className="space-y-4">
          <p className="text-white text-xl font-semibold leading-snug">
            Sistema de Gestion de<br />
            <span className="text-[#00A8E8]">Centros de Acopio</span>
          </p>
          <p className="text-white/50 text-sm">
            Digitalizando la ayuda humanitaria para Venezuela.
            Cada donacion registrada, cada envio trazado.
          </p>
          <div className="pt-4 text-[#00A8E8] tracking-widest text-lg">★ ★ ★ ★ ★ ★ ★</div>
        </div>
        <p className="text-white/20 text-xs">AcopioVzla — {new Date().getFullYear()}</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Logo Operación Todos con Venezuela */}
          <img src="/Operacion_transparente.svg" alt="Operación Todos con Venezuela"
            className="h-28 w-auto mx-auto mb-6" />

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-[#1B3078] mb-1">Bienvenido</h2>
            <p className="text-gray-500 text-sm mb-6">Inicia sesion para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo electronico"
                type="email"
                placeholder="voluntario@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Entrar al sistema
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-1.5 text-center text-sm text-gray-500">
              <p>
                ¿Tienes un centro de acopio?{" "}
                <a href="/registrar-centro" className="text-[#00A8E8] font-semibold hover:underline">
                  Regístralo aquí
                </a>
              </p>
              <p>
                ¿Quieres ser voluntario?{" "}
                <a href="/registrar-voluntario" className="text-[#00A8E8] font-semibold hover:underline">
                  Únete a un centro
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Juntos ayudamos a Venezuela 🇻🇪
          </p>
        </div>
      </div>
    </div>
  );
}
