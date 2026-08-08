"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm !== "ELIMINAR") return;
    startTransition(async () => {
      await deleteAccount();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm text-on-surface-variant underline underline-offset-2 hover:text-error transition-colors"
      >
        Eliminar mi cuenta
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-error">
              <AlertTriangle size={20} />
              Eliminar cuenta
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              Esta acción es <strong className="text-on-surface">permanente</strong>.
              Se cerrará tu sesión, se eliminarán tus datos personales y saldrás de
              todos tus hogares. El historial compartido (gastos, tareas, mensajes)
              se mantendrá de forma anónima.
            </p>

            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Escribe ELIMINAR para confirmar
              </label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="ELIMINAR"
                className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-error"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                }}
                className="flex-1 h-12 rounded-pill font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirm !== "ELIMINAR" || pending}
                className="flex-1 h-12 rounded-pill font-bold bg-error text-white hover:bg-error/90 disabled:opacity-50"
              >
                {pending ? "Eliminando..." : "Eliminar cuenta"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
