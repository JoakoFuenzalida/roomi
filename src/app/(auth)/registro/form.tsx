"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RegistroForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(register, null);
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  const hasError = Boolean(state?.error);

  return (
    <form action={action} className="flex flex-col flex-1">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Crear tu cuenta
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Te toma menos que lavar un plato.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Nombre" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={cn(
              "w-full rounded-[12px] border-[1.5px] px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors",
              hasError
                ? "border-error bg-error-container/50"
                : "border-outline",
            )}
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
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
        </Field>

        {hasError && (
          <p className="text-error text-xs font-semibold" role="alert">
            {state?.error}
          </p>
        )}
      </div>

      <div className="mt-auto pt-8 space-y-4">
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)]"
        >
          {pending ? "Creando..." : "Crear cuenta"}
        </Button>

        <p className="text-sm text-center text-on-surface-variant">
          ¿Ya tienes cuenta?{" "}
          <Link href={loginHref} className="text-primary font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
