"use client";

import { useState, useTransition, useRef } from "react";
import { uploadAvatar } from "@/actions/profile";
import { AvatarInitials } from "@/components/avatar-initials";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfilePictureUpload({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
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
        await uploadAvatar(formData);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <>
      <div className="relative group shrink-0">
        <AvatarInitials name={name} imageUrl={imageUrl} size={56} className="group-hover:opacity-75 transition-opacity" />
        
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
            <Loader2 className="animate-spin text-white" size={20} />
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
            aria-label="Cambiar foto de perfil"
          >
            <Camera className="text-white" size={20} />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && (
        <div className="absolute top-full left-0 mt-2 w-full bg-error-container text-error text-[12px] p-2 rounded z-10">
          {error}
        </div>
      )}
    </>
  );
}
