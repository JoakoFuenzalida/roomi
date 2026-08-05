"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissed = localStorage.getItem("roomi-install-dismissed");
    if (dismissed) {
      const ts = Number(dismissed);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem("roomi-install-dismissed", String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-50 p-3">
      <div className="max-w-md mx-auto rounded-[14px] bg-primary-container border border-primary/20 p-4 shadow-[0_8px_24px_rgba(255,107,107,0.2)] flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
          <Download size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[14px] text-on-primary-container">
            Instala Roomi
          </p>
          <p className="text-[12px] text-on-primary-container/70 mt-0.5">
            Acceso directo desde tu pantalla de inicio, sin navegador.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-4 py-2 rounded-pill bg-primary text-on-primary text-[13px] font-bold"
            >
              {installing ? "..." : "Instalar"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-pill text-on-primary-container/60 text-[13px] font-semibold"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-on-primary-container/40"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
