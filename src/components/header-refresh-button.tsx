"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function HeaderRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spin, setSpin] = useState(false);

  const handleRefresh = () => {
    if (isPending || spin) return;
    setSpin(true);
    startTransition(() => {
      router.refresh();
    });
    setTimeout(() => setSpin(false), 1000);
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isPending || spin}
      className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all active:scale-95"
      aria-label="Actualizar datos"
    >
      <RefreshCcw size={16} className={cn((isPending || spin) && "animate-spin text-primary")} />
    </button>
  );
}
