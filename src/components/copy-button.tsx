"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-pill px-3 text-xs font-semibold gap-1.5 shrink-0"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? (
        <>
          <Check size={13} /> ¡Copiado!
        </>
      ) : (
        <>
          <Copy size={13} /> Copiar
        </>
      )}
    </Button>
  );
}
