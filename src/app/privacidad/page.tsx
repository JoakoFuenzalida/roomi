import Link from "next/link";
import { RoomiSymbol } from "@/components/roomi-logo";

export default function PrivacidadPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-primary font-semibold text-sm">
        &larr; Volver
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-primary-container flex items-center justify-center">
          <RoomiSymbol size={22} />
        </div>
        <h1 className="font-display font-bold text-[24px]">Política de Privacidad</h1>
      </div>

      <p className="text-xs text-on-surface-variant mb-6">Última actualización: 9 de agosto de 2026</p>

      <div className="prose-sm space-y-5 text-on-surface text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Datos que recopilamos</h2>
          <p>Al usar Roomi recopilamos:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y foto de perfil (opcional).</li>
            <li><strong>Datos de uso:</strong> tareas, gastos, avisos y mensajes que creas dentro de tu hogar.</li>
            <li><strong>Datos técnicos:</strong> dirección IP (para seguridad/rate limiting), suscripción push (para notificaciones).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. Cómo usamos tus datos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Proveer y mejorar el servicio de Roomi.</li>
            <li>Enviar notificaciones push sobre actividad de tu hogar.</li>
            <li>Enviar correos transaccionales (recuperación de contraseña).</li>
            <li>Proteger la seguridad de la plataforma (rate limiting, detección de abuso).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. Almacenamiento</h2>
          <p>
            Tus datos se almacenan en servidores de Supabase (región Sudamérica, São Paulo)
            y se despliegan a través de Vercel. Las contraseñas se almacenan hasheadas con
            bcrypt y nunca en texto plano.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. Compartición de datos</h2>
          <p>
            No vendemos, alquilamos ni compartimos tus datos personales con terceros, excepto:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Dentro de tu hogar:</strong> los miembros de tu hogar ven tu nombre, foto, tareas, gastos y mensajes compartidos.</li>
            <li><strong>Proveedores de infraestructura:</strong> Supabase (base de datos), Vercel (hosting), Resend (emails transaccionales) procesan datos según sus propias políticas de privacidad.</li>
            <li><strong>Obligación legal:</strong> si la ley lo requiere.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. Cookies y almacenamiento local</h2>
          <p>
            Roomi usa cookies de sesión para autenticación (httpOnly, secure) y localStorage
            para preferencias de tema (claro/oscuro) y estado del prompt de instalación.
            No usamos cookies de seguimiento ni analytics de terceros.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. Tus derechos</h2>
          <p>Puedes:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Acceder</strong> a tus datos desde tu perfil.</li>
            <li><strong>Modificar</strong> tu nombre y foto de perfil en cualquier momento.</li>
            <li><strong>Eliminar</strong> tu cuenta desde el perfil. Tus datos personales se anonimizan; los datos compartidos (gastos, tareas completadas) se conservan para no afectar a tu hogar.</li>
            <li><strong>Revocar notificaciones</strong> desactivándolas desde la configuración de tu navegador.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">7. Seguridad</h2>
          <p>
            Implementamos medidas de seguridad como: contraseñas hasheadas (bcrypt), tokens
            de sesión JWT, rate limiting en autenticación, validación de uploads y protección
            CSRF en Server Actions de Next.js.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">8. Menores de edad</h2>
          <p>
            Roomi no está dirigido a menores de 13 años. No recopilamos intencionalmente
            datos de menores.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">9. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política. Los cambios se publican en esta página con
            la fecha de actualización.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">10. Contacto</h2>
          <p>
            Para consultas sobre privacidad: <a href="mailto:don.claudio.ia@gmail.com" className="text-primary font-semibold">don.claudio.ia@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
