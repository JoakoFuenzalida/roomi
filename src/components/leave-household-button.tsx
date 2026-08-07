"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LeaveHouseholdButton({ onLeave }: { onLeave: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Estás seguro que deseas salir de este hogar?")) {
          startTransition(async () => {
            await onLeave();
          });
        }
      }}
      className="w-full h-10 rounded-pill text-error hover:bg-error-container hover:text-on-error-container text-sm font-semibold"
    >
      {pending ? "Saliendo..." : "Salir del hogar"}
    </Button>
  );
}
