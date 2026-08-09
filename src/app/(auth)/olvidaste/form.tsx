"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <div className="flex flex-col flex-1">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[28px] leading-tight">
            Revisa tu email
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {state.success}
          </p>
        </div>
        <div className="mt-auto pt-8">
          <Link
            href="/login"
            className="block text-center text-primary font-semibold text-sm"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <form action={action} className="flex flex-col flex-1">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-error text-xs font-semibold" role="alert">
              {state.error}
            </p>
          )}
        </div>

        <div className="mt-auto pt-8 space-y-4">
          <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)]"
          >
            {pending ? "Enviando..." : "Enviar enlace"}
          </Button>

          <p className="text-sm text-center text-on-surface-variant">
            ¿Ya recordaste?{" "}
            <Link href="/login" className="text-primary font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
