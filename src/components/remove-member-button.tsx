"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function RemoveMemberButton({ 
  onRemove,
  memberName
}: { 
  onRemove: () => Promise<void>;
  memberName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Estás seguro que deseas eliminar a ${memberName} del hogar? El link de invitación será regenerado.`)) {
          startTransition(async () => {
            await onRemove();
          });
        }
      }}
      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors disabled:opacity-50"
      aria-label="Eliminar miembro"
    >
      <Trash2 size={16} />
    </button>
  );
}
