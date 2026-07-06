"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const registerHref = callbackUrl
    ? `/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/registro";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
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
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        ¿Sin cuenta?{" "}
        <Link href={registerHref} className="underline">
          Crear una
        </Link>
      </p>
    </form>
  );
}
