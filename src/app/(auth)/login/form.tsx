"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, googleSignIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const registerHref = callbackUrl
    ? `/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/registro";

  const hasError = Boolean(state?.error);

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Hola de nuevo 👋
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          La casa te echaba de menos.
        </p>
      </div>

      <form action={() => googleSignIn(callbackUrl)}>
        <button
          type="submit"
          className="w-full h-14 rounded-pill border-[1.5px] border-outline bg-surface-container-lowest text-on-surface font-semibold flex items-center justify-center gap-3 hover:bg-surface-container transition-colors"
        >
          <GoogleIcon />
          Continuar con Google
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs text-on-surface-variant font-semibold uppercase">o</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <form action={action} className="flex flex-col flex-1">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

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
    </div>
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
