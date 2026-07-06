"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validators";

export type AuthState = { error: string } | null;

function safeCallback(raw: FormDataEntryValue | null): string {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/hoy";
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return { error: "Ese email ya está registrado" };

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "No pudimos iniciar sesión" };
    throw error;
  }
  return null;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }
  return null;
}
