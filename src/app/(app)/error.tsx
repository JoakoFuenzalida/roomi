"use client";

import { useEffect } from "react";
import { RoomiSymbol } from "@/components/roomi-logo";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <RoomiSymbol size={36} />
      </div>
      <h1 className="font-display font-semibold text-[22px]">
        Algo salió mal
      </h1>
      <p className="text-sm text-on-surface-variant max-w-xs">
        Hubo un error inesperado. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="flex gap-3 mt-2">
        <Button
          onClick={reset}
          className="h-12 rounded-pill px-6 font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
        >
          Reintentar
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/hoy")}
          className="h-12 rounded-pill px-6 font-bold"
        >
          Ir al inicio
        </Button>
      </div>
    </main>
  );
}
