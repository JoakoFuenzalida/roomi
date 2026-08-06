"use client";

import { useState, useTransition, useEffect, useActionState } from "react";
import { updateProfileName } from "@/actions/profile";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function EditProfileButton({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <Pencil size={18} />
      </button>
      <EditProfileSheet
        name={name}
        imageUrl={imageUrl}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function EditProfileSheet({
  name,
  imageUrl,
  open,
  onOpenChange,
}: {
  name: string;
  imageUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileName, null);

  useEffect(() => {
    if (state && "success" in state) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Editar Perfil</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col items-center gap-4">
            <ProfilePictureUpload name={name} imageUrl={imageUrl} />
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Nombre visible
              </label>
              <input
                name="name"
                defaultValue={name}
                required
                minLength={2}
                maxLength={40}
                className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {state && "error" in state && (
              <p className="text-error text-[13px]">{state.error}</p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 rounded-pill font-bold"
            >
              {isPending ? "..." : "Guardar cambios"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
