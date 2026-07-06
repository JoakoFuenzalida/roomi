"use client";

import { useActionState } from "react";
import { createHousehold, joinHousehold } from "@/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState(createHousehold, null);
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del hogar</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={40}
          placeholder="Depa Vitacura"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando..." : "Crear hogar"}
      </Button>
    </form>
  );
}

export function JoinHouseholdForm() {
  const [state, action, pending] = useActionState(joinHousehold, null);
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="code">Código de invitación</Label>
        <Input id="code" name="code" required placeholder="clx1a2b3c..." />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Uniéndote..." : "Unirme con código"}
      </Button>
    </form>
  );
}
