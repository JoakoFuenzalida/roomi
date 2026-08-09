import Link from "next/link";
import { RoomiSymbol } from "@/components/roomi-logo";

export default function TerminosPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-primary font-semibold text-sm">
        &larr; Volver
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-primary-container flex items-center justify-center">
          <RoomiSymbol size={22} />
        </div>
        <h1 className="font-display font-bold text-[24px]">Términos de Uso</h1>
      </div>

      <p className="text-xs text-on-surface-variant mb-6">Última actualización: 9 de agosto de 2026</p>

      <div className="prose-sm space-y-5 text-on-surface text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Aceptación</h2>
          <p>
            Al crear una cuenta en Roomi aceptas estos términos. Roomi es un proyecto independiente
            desarrollado por estudiantes; no es una empresa constituida. Si no estás de acuerdo,
            no utilices la aplicación.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. Descripción del servicio</h2>
          <p>
            Roomi es una aplicación web progresiva (PWA) que ayuda a coordinar la convivencia
            entre personas que comparten vivienda: rotación de tareas, compras compartidas,
            cuentas mensuales y comunicación del hogar.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. Registro y cuenta</h2>
          <p>
            Debes proporcionar información veraz al registrarte. Eres responsable de mantener
            la seguridad de tu contraseña. Cada persona debe tener su propia cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. Uso aceptable</h2>
          <p>Te comprometes a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Usar Roomi solo para gestionar convivencia real.</li>
            <li>No compartir contenido ofensivo, ilegal o que viole derechos de terceros.</li>
            <li>No intentar acceder a hogares o datos de otros usuarios sin autorización.</li>
            <li>No automatizar el acceso ni hacer ingeniería inversa de la aplicación.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. Datos financieros</h2>
          <p>
            Roomi facilita el registro y cálculo de gastos compartidos, pero no procesa pagos
            reales ni transfiere dinero. Los montos registrados son informativos y los pagos
            entre roomis se realizan por los medios que ellos elijan fuera de la app.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. Disponibilidad</h2>
          <p>
            Roomi se ofrece "tal cual" sin garantías de disponibilidad, rendimiento o
            permanencia. Podemos modificar, suspender o descontinuar el servicio en cualquier
            momento. Haremos lo posible por avisar con anticipación.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">7. Eliminación de cuenta</h2>
          <p>
            Puedes eliminar tu cuenta en cualquier momento desde la sección de perfil.
            Al hacerlo, tus datos personales se anonimizan y se preservan los datos
            compartidos (gastos, tareas) para no afectar a los demás miembros del hogar.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">8. Limitación de responsabilidad</h2>
          <p>
            Roomi no es responsable por disputas entre roomis, pérdida de datos, errores
            en cálculos financieros ni daños derivados del uso de la aplicación. Los usuarios
            son responsables de verificar la exactitud de los montos registrados.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">9. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Los cambios entran en vigencia al publicarse.
            El uso continuado de Roomi constituye aceptación de los nuevos términos.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">10. Contacto</h2>
          <p>
            Para consultas sobre estos términos: <a href="mailto:don.claudio.ia@gmail.com" className="text-primary font-semibold">don.claudio.ia@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
