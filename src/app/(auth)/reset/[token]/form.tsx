"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmPasswordReset } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmPasswordReset, null);

  if (state?.success) {
    return (
      <div className="flex flex-col flex-1">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[28px] leading-tight">
            Contraseña actualizada
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {state.success}
          </p>
        </div>
        <div className="mt-auto pt-8">
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)]"
          >
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Nueva contraseña
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>

      <form action={action} className="flex flex-col flex-1">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
            >
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              Mínimo 8 caracteres.
            </p>
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
            {pending ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </div>
      </form>
    </div>
  );
}
