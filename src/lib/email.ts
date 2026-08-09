import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Roomi <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Recupera tu contraseña — Roomi",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #FF6B6B; margin: 0 0 16px;">Roomi</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          Alguien solicitó restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón:
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #FF6B6B; color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 15px;">
          Restablecer contraseña
        </a>
        <p style="color: #888; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          Este enlace expira en 1 hora. Si no solicitaste esto, ignora este email.
        </p>
      </div>
    `,
  });
}
