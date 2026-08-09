"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

export function ResetRankingButton({
  onReset,
}: {
  onReset: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    if (window.confirm("¿Seguro que quieres reiniciar el ranking?\nEsto pondrá los RoomiCoins de todos en 0. Esta acción no se puede deshacer.")) {
      startTransition(async () => {
        await onReset();
      });
    }
  };

  return (
    <button
      onClick={handleReset}
      className="w-full flex items-center justify-center gap-2 h-12 rounded-pill border border-error text-error font-bold text-[13px] hover:bg-error-container transition-colors disabled:opacity-50"
      disabled={isPending}
    >
      <RotateCcw size={16} />
      {isPending ? "Reiniciando..." : "Reiniciar Ranking de RoomiCoins"}
    </button>
  );
}
