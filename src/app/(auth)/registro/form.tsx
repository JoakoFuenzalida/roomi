"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegistroForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(register, null);
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">Empieza tu hogar en Roomi</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Crear cuenta"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href={loginHref} className="underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
