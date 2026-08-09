"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export type ResetRequestState = { success?: string; error?: string } | null;
export type ResetConfirmState = { success?: string; error?: string } | null;

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`reset:${ip}`, 3, 60_000);
  if (!allowed) {
    return { error: "Demasiados intentos. Intenta en 1 minuto." };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Ingresa tu email." };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, hashedPassword: true },
  });

  if (!user || !user.hashedPassword) {
    return { success: "Si el email existe, recibirás un enlace para restablecer tu contraseña." };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset/${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (e) {
    console.error("Error sending reset email:", e);
    return { error: "No pudimos enviar el email. Intenta de nuevo." };
  }

  return { success: "Si el email existe, recibirás un enlace para restablecer tu contraseña." };
}

export async function confirmPasswordReset(
  _prev: ResetConfirmState,
  formData: FormData,
): Promise<ResetConfirmState> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token) return { error: "Token inválido." };
  if (!password || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const reset = await db.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { id: true } } },
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { error: "Este enlace expiró o ya fue usado. Solicita uno nuevo." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({
      where: { id: reset.user.id },
      data: { hashedPassword },
    }),
    db.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: "Contraseña actualizada. Ya puedes iniciar sesión." };
}
