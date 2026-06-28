import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Building2, Users, HeartHandshake, PackagePlus,
  User, MapPin, CheckCircle2, Search, FileSpreadsheet, Eye, Filter, Plus,
  ListChecks, LogIn, Mic,
} from "lucide-react";

export const metadata = {
  title: "¿Cómo funciona? — Acopio Venezuela",
  description: "Guía paso a paso: registra tu centro, agrega coordinadores y voluntarios, y gestiona donaciones.",
};

/* ── Marco tipo ventana para los mockups ── */
function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden w-full">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="ml-2 text-[11px] text-gray-400 font-medium truncate">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const Field = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div>
    <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
    <div className={`text-xs rounded-lg px-2.5 py-1.5 border ${accent ? "border-[#1B3078]/30 bg-[#EEF1FB] text-[#1B3078] font-medium" : "border-gray-200 text-gray-600"}`}>{value}</div>
  </div>
);

const FakeBtn = ({ children, solid = true }: { children: React.ReactNode; solid?: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${solid ? "bg-[#1B3078] text-white" : "border border-gray-200 text-gray-600"}`}>{children}</span>
);

/* ── Paso numerado ── */
function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-[#1B3078] text-white text-sm font-bold flex items-center justify-center">{n}</span>
      <p className="text-[15px] text-gray-600 leading-relaxed pt-0.5">{children}</p>
    </li>
  );
}

/* ── Sección (texto + mockup, alternando lado) ── */
function Seccion({ num, icon: Icon, titulo, intro, pasos, mockup, invertir = false }: {
  num: string; icon: any; titulo: string; intro: string;
  pasos: React.ReactNode; mockup: React.ReactNode; invertir?: boolean;
}) {
  return (
    <section className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
      <div className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center ${invertir ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#EEF1FB] flex items-center justify-center shrink-0">
              <Icon size={22} className="text-[#1B3078]" />
            </div>
            <span className="text-xs font-bold text-[#00A8E8] uppercase tracking-widest">Paso {num}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{titulo}</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">{intro}</p>
          <ol className="space-y-3.5">{pasos}</ol>
        </div>
        <div className="lg:px-4">{mockup}</div>
      </div>
    </section>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white/95 backdrop-blur border-b border-gray-100 h-14 flex items-center px-5 gap-4 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#1B3078] text-sm font-medium">
          <ArrowLeft size={16} /> Inicio
        </Link>
        <span className="ml-auto text-base font-bold text-[#1B3078] tracking-tight">
          Acopio<span className="text-[#00A8E8]"> Venezuela</span>
        </span>
      </nav>

      {/* Hero */}
      <header className="text-center px-5 py-14 sm:py-20"
        style={{ background: "linear-gradient(135deg, #0f1f5c 0%, #1B3078 55%, #1e3a8a 100%)" }}>
        <span className="inline-block text-[#00A8E8] text-xs font-bold uppercase tracking-widest mb-3">Guía rápida</span>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">¿Cómo funciona?</h1>
        <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
          Todo lo que necesitas saber para registrar tu centro, sumar a tu equipo y llevar el control de las donaciones — paso a paso.
        </p>
        {/* índice */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            { href: "#centro", icon: Building2, label: "Registrar centro" },
            { href: "#equipo", icon: Users, label: "Coordinadores y voluntarios" },
            { href: "#voluntario", icon: HeartHandshake, label: "Ser voluntario" },
            { href: "#donaciones", icon: PackagePlus, label: "Donaciones" },
          ].map(({ href, icon: Icon, label }) => (
            <a key={href} href={href}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3.5 py-2 rounded-lg border border-white/10 transition-colors">
              <Icon size={15} /> {label}
            </a>
          ))}
        </div>
      </header>

      {/* ── 1. Registrar centro ── */}
      <div id="centro" className="scroll-mt-16">
        <Seccion
          num="1" icon={Building2}
          titulo="Registra tu centro de acopio"
          intro="Cualquier persona puede crear su centro. Quien lo registra queda como Responsable y puede empezar a gestionarlo de inmediato."
          pasos={<>
            <Paso n={1}>En la página de inicio, toca <b>«Registra tu centro»</b>.</Paso>
            <Paso n={2}>Completa <b>tus datos como responsable</b>: nombre, correo y contraseña (con eso iniciarás sesión).</Paso>
            <Paso n={3}>Completa los <b>datos del centro</b>: nombre, país, ciudad, dirección, WhatsApp y ubicación en el mapa.</Paso>
            <Paso n={4}>Toca <b>«Registrar centro»</b>. Tu centro queda <b>activo de inmediato</b>.</Paso>
            <Paso n={5}>Inicia sesión con tu correo y contraseña para gestionarlo.</Paso>
          </>}
          mockup={
            <Frame title="Registra tu centro de acopio">
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><User size={12} /> Tus datos (responsable)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nombre completo" value="María Pérez" />
                  <Field label="Correo" value="maria@correo.com" />
                </div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-1"><Building2 size={12} /> Datos del centro</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nombre del centro" value="Centro Cuenca" accent />
                  <Field label="País" value="Ecuador" />
                </div>
                <div className="h-16 rounded-lg bg-[#EEF1FB] border border-[#1B3078]/10 flex items-center justify-center text-[#1B3078]/50">
                  <MapPin size={20} />
                </div>
                <div className="flex justify-end pt-1"><FakeBtn>Registrar centro</FakeBtn></div>
              </div>
            </Frame>
          }
        />
      </div>

      {/* ── 2. Coordinadores y voluntarios ── */}
      <div id="equipo" className="scroll-mt-16 bg-gray-50">
        <Seccion
          num="2" icon={Users} invertir
          titulo="Agrega coordinadores y voluntarios"
          intro="Como Responsable arma tu equipo: los coordinadores te ayudan a gestionar el centro, y los voluntarios quedan registrados para que los contactes."
          pasos={<>
            <Paso n={1}>Inicia sesión y entra a <b>«Mi Centro»</b>.</Paso>
            <Paso n={2}>Toca <b>«Nuevo usuario»</b>.</Paso>
            <Paso n={3}>Elige el rol: <b>Coordinador</b> (accede al sistema, registra donaciones y suma voluntarios) o <b>Voluntario</b>.</Paso>
            <Paso n={4}>Completa los datos y toca <b>«Crear»</b>. Para los coordinadores defines correo y contraseña.</Paso>
          </>}
          mockup={
            <Frame title="Mi Centro">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700">Equipo del centro</p>
                <FakeBtn><Plus size={13} /> Nuevo usuario</FakeBtn>
              </div>
              <div className="space-y-2">
                {[
                  { n: "Juan Gómez", r: "Coordinador", c: "info" },
                  { n: "Ana Ríos", r: "Coordinador", c: "info" },
                  { n: "Luis Mora", r: "Voluntario", c: "gray" },
                ].map((u) => (
                  <div key={u.n} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#1B3078]/10 flex items-center justify-center text-[#1B3078] text-[11px] font-bold">{u.n[0]}</span>
                      <span className="text-xs font-medium text-gray-700">{u.n}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.c === "info" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{u.r}</span>
                  </div>
                ))}
              </div>
            </Frame>
          }
        />
      </div>

      {/* ── 3. Voluntario ── */}
      <div id="voluntario" className="scroll-mt-16">
        <Seccion
          num="3" icon={HeartHandshake}
          titulo="Únete como voluntario"
          intro="¿Quieres ayudar? Regístrate y asóciate a un centro existente. El equipo del centro te contactará."
          pasos={<>
            <Paso n={1}>En el inicio, toca <b>«Únete como voluntario»</b>.</Paso>
            <Paso n={2}><b>Elige el centro</b> al que quieres apoyar.</Paso>
            <Paso n={3}>Completa tus datos: nombre y teléfono (y lo demás opcional).</Paso>
            <Paso n={4}>Toca <b>«Registrarme»</b>. ¡Listo! El centro se pondrá en contacto contigo.</Paso>
          </>}
          mockup={
            <Frame title="Únete como voluntario">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-0.5">Centro al que te quieres unir</p>
                  <div className="text-xs rounded-lg px-2.5 py-2 border border-[#1B3078]/30 bg-[#EEF1FB] text-[#1B3078] font-medium flex items-center justify-between">
                    Centro Cuenca — Cuenca, Ecuador <CheckCircle2 size={14} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nombre completo" value="Pedro Salas" />
                  <Field label="Teléfono" value="+58 412 …" />
                </div>
                <div className="flex justify-end pt-1"><FakeBtn><HeartHandshake size={13} /> Registrarme</FakeBtn></div>
              </div>
            </Frame>
          }
        />
      </div>

      {/* ── 4. Donaciones ── */}
      <div id="donaciones" className="scroll-mt-16 bg-gray-50">
        <Seccion
          num="4" icon={PackagePlus} invertir
          titulo="Registra y consulta donaciones"
          intro="Lleva el control de todo lo que entra a tu centro: una por una, dictando por voz, o importando una hoja de Excel/CSV completa."
          pasos={<>
            <Paso n={1}>Entra a <b>«Donaciones»</b> y toca <b>«Registrar donación»</b>: busca el producto, pon la cantidad y guarda.</Paso>
            <Paso n={2}><b>¡Dicta por voz!</b> Toca <b>«Dictar por voz»</b> 🎤 y habla: «4 kilos de arroz», «2 latas de atún de 80 gramos»… cada producto se agrega solo mientras lo dices.</Paso>
            <Paso n={3}>¿Tienes muchas en Excel? Toca <b>«Importar CSV»</b>, sube el archivo, <b>asocia las columnas</b> (producto, cantidad, peso…), revisa la vista previa e <b>importa</b>.</Paso>
            <Paso n={4}>Para consultar: <b>filtra</b> por país, ciudad, centro o fecha, abre el <b>detalle</b> con el ojo y <b>descarga el CSV</b>.</Paso>
          </>}
          mockup={
            <Frame title="Donaciones">
              <div className="flex items-center justify-between mb-2 gap-2">
                <FakeBtn solid={false}><FileSpreadsheet size={13} /> Importar CSV</FakeBtn>
                <FakeBtn><Plus size={13} /> Registrar donación</FakeBtn>
              </div>
              <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-white rounded-lg py-1.5"
                style={{ background: "linear-gradient(90deg, #1B3078 0%, #00A8E8 100%)" }}>
                <Mic size={13} /> Dictar por voz · “4 kilos de arroz”
              </div>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-400">
                <Filter size={12} /> País · Ciudad · Centro · Fecha
              </div>
              <div className="space-y-2">
                {[
                  { d: "Donante anónimo", p: "8 productos", k: "12,5 kg" },
                  { d: "Fundación Luz", p: "3 productos", k: "30 u" },
                  { d: "Familia Pérez", p: "5 productos", k: "6 L" },
                ].map((r) => (
                  <div key={r.d} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{r.d}</p>
                      <p className="text-[10px] text-gray-400">{r.p}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#1B3078]">{r.k}</span>
                      <Eye size={13} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </Frame>
          }
        />
      </div>

      {/* CTA final */}
      <section className="px-5 py-16 text-center" style={{ background: "linear-gradient(135deg, #0f1f5c 0%, #1B3078 100%)" }}>
        <ListChecks size={32} className="mx-auto text-[#00A8E8] mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">¿Listo para empezar?</h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">Registra tu centro en minutos o únete como voluntario a uno existente.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/registrar-centro" className="inline-flex items-center justify-center gap-2 bg-[#00A8E8] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0090C8] transition-colors">
            Registra tu centro <ArrowRight size={16} />
          </Link>
          <Link href="/registrar-voluntario" className="inline-flex items-center justify-center gap-2 bg-white text-[#1B3078] font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
            Únete como voluntario <HeartHandshake size={16} />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
            Acceder al sistema <LogIn size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
