"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const registerHref = callbackUrl
    ? `/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/registro";

  const hasError = Boolean(state?.error);

  return (
    <form action={action} className="flex flex-col flex-1">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Hola de nuevo 👋
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          La casa te echaba de menos.
        </p>
      </div>

      <div className="space-y-4">
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
            autoComplete="current-password"
            className={cn(
              "w-full rounded-[12px] border-[1.5px] px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors",
              hasError
                ? "border-error bg-error-container/50"
                : "border-outline",
            )}
          />
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
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-sm text-center text-on-surface-variant">
          ¿Sin cuenta?{" "}
          <Link href={registerHref} className="text-primary font-semibold">
            Crear una
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
