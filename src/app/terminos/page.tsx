import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones — Acopio Venezuela",
  description:
    "Términos de uso, política de privacidad y limitación de responsabilidad de la plataforma Acopio Venezuela.",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-[#1B3078] mb-3">{titulo}</h2>
      <div className="text-[15px] text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 h-14 flex items-center px-5 gap-4 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#1B3078] text-sm font-medium">
          <ArrowLeft size={16} /> Inicio
        </Link>
        <span className="ml-auto text-base font-bold text-[#1B3078] tracking-tight">
          Acopio<span className="text-[#00A8E8]"> Venezuela</span>
        </span>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#EEF1FB] flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#1B3078]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3078]">Términos y Condiciones</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</p>

        <Seccion titulo="1. Sobre Acopio Venezuela">
          <p>
            <strong>Acopio Venezuela</strong> es una plataforma digital independiente desarrollada para apoyar la
            gestión y trazabilidad de donaciones humanitarias dirigidas a Venezuela. Permite a centros de acopio
            registrar donaciones, inventarios, voluntarios y envíos.
          </p>
          <p>
            Esta plataforma <strong>NO está asociada, vinculada ni patrocinada</strong> por ningún partido político,
            gobierno, organización religiosa, ONG específica, empresa privada ni movimiento social. Su único objetivo
            es servir como herramienta tecnológica neutral al servicio de la ayuda humanitaria.
          </p>
        </Seccion>

        <Seccion titulo="2. Naturaleza del servicio">
          <p>
            Acopio Venezuela es una <strong>herramienta de gestión</strong>: la plataforma facilita el registro y
            consulta de información sobre donaciones, pero <strong>NO recibe, almacena, transporta ni distribuye
            bienes físicos</strong>. Toda la operativa logística la realizan los centros de acopio y sus voluntarios
            de manera independiente.
          </p>
          <p>
            La plataforma se ofrece &quot;tal cual&quot; (as-is). No garantizamos disponibilidad continua, ausencia
            de errores, ni que el servicio se ajuste a usos específicos no previstos.
          </p>
        </Seccion>

        <Seccion titulo="3. Datos personales y privacidad">
          <p>Para operar la plataforma se recopilan los siguientes datos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>De usuarios registrados (administradores, coordinadores, voluntarios): nombre, correo electrónico y una contraseña cifrada.</li>
            <li>De donantes registrados por terceros: nombre y nacionalidad <em>(opcionales)</em>. El donante no tiene cuenta en la plataforma.</li>
            <li>De centros de acopio: nombre, dirección, ciudad, país, datos de contacto y banner.</li>
            <li>De donaciones, envíos y consumos: productos, cantidades, fechas y notas registradas por el usuario.</li>
            <li>Datos técnicos automáticos: registros de acceso (logs) para fines de seguridad y diagnóstico.</li>
          </ul>
          <p>
            Los datos se almacenan en servidores de terceros (proveedores de hosting e infraestructura) bajo medidas
            razonables de seguridad. <strong>No se comercializan ni se ceden a terceros</strong> ajenos a la operación
            técnica del servicio.
          </p>
        </Seccion>

        <Seccion titulo="4. Responsabilidad del usuario">
          <p>
            <strong>Toda la información registrada en la plataforma es responsabilidad exclusiva del usuario que la
            introduce.</strong> Los administradores y coordinadores de cada centro son responsables de la veracidad,
            actualización y legalidad de los datos que carguen, incluyendo el consentimiento de las personas
            mencionadas como donantes.
          </p>
          <p>
            El usuario se compromete a usar la plataforma de buena fe, sin manipular cifras, suplantar identidad ni
            registrar información falsa o que vulnere derechos de terceros.
          </p>
        </Seccion>

        <Seccion titulo="5. Limitación de responsabilidad">
          <p>
            Acopio Venezuela <strong>no se hace responsable</strong> por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>La exactitud, integridad o legalidad de los datos cargados por los usuarios.</li>
            <li>Decisiones tomadas con base en la información mostrada en la plataforma.</li>
            <li>Pérdidas, daños o reclamaciones derivadas del uso o la imposibilidad de uso del servicio.</li>
            <li>Interrupciones temporales del servicio, fallos de terceros (hosting, internet, proveedores) o pérdida de datos por causas ajenas razonables.</li>
            <li>La gestión, transporte o entrega física de las donaciones.</li>
          </ul>
        </Seccion>

        <Seccion titulo="6. Uso aceptable">
          <p>Queda expresamente prohibido utilizar la plataforma para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fines político-electorales, propaganda partidista o promoción de candidaturas.</li>
            <li>Fines comerciales sin autorización expresa.</li>
            <li>Recabar datos personales para usos distintos a la operativa humanitaria.</li>
            <li>Cualquier actividad ilegal, fraudulenta o que vulnere derechos de terceros.</li>
            <li>Acceso no autorizado, ingeniería inversa o intentos de comprometer la seguridad del sistema.</li>
          </ul>
          <p>
            El incumplimiento de estas reglas faculta a los administradores de la plataforma a suspender o eliminar
            cuentas y datos asociados sin previo aviso.
          </p>
        </Seccion>

        <Seccion titulo="7. Independencia política y neutralidad">
          <p>
            Acopio Venezuela es una iniciativa <strong>técnica e independiente</strong>. No representa, respalda ni
            promueve a ningún actor político, partido, gobierno, candidato, religión ni causa más allá de la asistencia
            humanitaria. Cualquier uso de la plataforma con fines distintos será considerado una violación de estos
            términos.
          </p>
        </Seccion>

        <Seccion titulo="8. Propiedad intelectual">
          <p>
            El código fuente, diseño y marca de Acopio Venezuela son propiedad de sus desarrolladores. Los datos
            cargados (productos, donaciones, inventarios) son responsabilidad y propiedad del centro que los registra.
          </p>
        </Seccion>

        <Seccion titulo="9. Cookies y sesión">
          <p>
            La plataforma utiliza cookies estrictamente necesarias para mantener la sesión de los usuarios autenticados
            (autenticación basada en JSON Web Tokens). No se utilizan cookies de análisis, publicidad ni terceros.
          </p>
        </Seccion>

        <Seccion titulo="10. Derechos del titular de los datos">
          <p>
            Las personas cuyos datos figuren en la plataforma pueden solicitar acceso, rectificación o eliminación de
            los mismos mediante el centro de acopio que los registró o contactando con los administradores de la
            plataforma. Se atenderán solicitudes razonables en plazos prudenciales.
          </p>
        </Seccion>

        <Seccion titulo="11. Modificaciones">
          <p>
            Estos términos pueden actualizarse en cualquier momento para reflejar mejoras de la plataforma o cambios
            legales. La versión vigente será siempre la publicada en esta página.
          </p>
        </Seccion>

        <Seccion titulo="12. Contacto">
          <p>
            Para reportar abusos, problemas técnicos o ejercer derechos sobre datos personales, los usuarios pueden
            contactar a los administradores de la plataforma a través del centro de acopio correspondiente.
          </p>
        </Seccion>

        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
          <Link href="/" className="text-[#00A8E8] text-sm font-medium hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
