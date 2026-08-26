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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe pesar más de 10MB");
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
    <div className="flex flex-col items-center gap-3">
      <div className="relative shrink-0">
        <AvatarInitials name={name} imageUrl={imageUrl} size={80} />
        
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-pill bg-surface-container-high text-on-surface text-[13px] font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
        >
          <Camera size={16} /> Cámara
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-pill bg-surface-container-high text-on-surface text-[13px] font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
        >
          Galería
        </button>
      </div>

      <input
        type="file"
        ref={galleryInputRef}
        accept="image/jpeg, image/png, image/webp, image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/jpeg, image/png, image/webp, image/gif"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <div className="text-error text-[12px] font-semibold text-center mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
