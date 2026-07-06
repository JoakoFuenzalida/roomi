"use client";

import { useActionState } from "react";
import { createHousehold, joinHousehold } from "@/actions/household";
import { Button } from "@/components/ui/button";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState(createHousehold, null);
  return (
    <form action={action} className="space-y-3">
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Depa Ñuñoa"
        className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
      />
      {state?.error && (
        <p className="text-error text-xs font-semibold" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-pill font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
      >
        {pending ? "Creando..." : "Crear hogar"}
      </Button>
    </form>
  );
}

export function JoinHouseholdForm() {
  const [state, action, pending] = useActionState(joinHousehold, null);
  return (
    <form action={action} className="space-y-3">
      <input
        name="code"
        required
        placeholder="Pega el código o link"
        className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
        style={{ fontFamily: "ui-monospace, monospace", fontSize: "13px" }}
      />
      {state?.error && (
        <p className="text-error text-xs font-semibold" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className="w-full h-12 rounded-pill font-semibold"
      >
        {pending ? "Uniéndote..." : "Unirme con código"}
      </Button>
    </form>
  );
}
