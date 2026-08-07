"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { QrCode, X } from "lucide-react";

export function QRInviteButton({ inviteUrl }: { inviteUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-pill bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
        aria-label="Mostrar código QR de invitación"
      >
        <QrCode size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-surface-container-lowest p-6 rounded-[24px] shadow-xl w-full max-w-[320px] flex flex-col items-center gap-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <X size={20} />
            </button>
            <h3 className="font-display font-semibold text-[20px] mt-2">Invitar al hogar</h3>
            <p className="text-sm text-center text-on-surface-variant px-2">
              Pídele a tu roomi que escanee este código con su cámara.
            </p>
            <div className="bg-white p-4 rounded-[16px] w-full aspect-square flex items-center justify-center mt-2 border border-outline-variant">
              <QRCode
                value={inviteUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
