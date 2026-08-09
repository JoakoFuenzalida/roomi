"use client";

import { useState, useTransition, useRef } from "react";
import { uploadHouseholdCover } from "@/actions/household-cover";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function HouseholdCoverUpload({ householdId }: { householdId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe pesar más de 5MB");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        await uploadHouseholdCover(householdId, formData);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className={cn(
          "absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-pill bg-black/40 backdrop-blur-md text-white text-[12px] font-semibold hover:bg-black/60 transition-colors border border-white/20 shadow-sm",
          isPending && "opacity-50 pointer-events-none"
        )}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        <span>Cambiar Portada</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {error && (
        <div className="absolute top-12 right-3 z-20 bg-error text-on-error text-[11px] px-2 py-1 rounded shadow">
          {error}
        </div>
      )}
    </>
  );
}
