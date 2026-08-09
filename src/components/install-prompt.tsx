"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as any).standalone === true) return;

    // We don't check for dismissed in order to reinforce installation, 
    // but we can leave a small delay so it doesn't pop up instantly on first load.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.userAgent.includes("Mac") && "ontouchend" in document);
                  
    if (isIOS) {
      setShowIOS(true);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstallAndroid() {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowAndroid(false);
    setShowIOS(false);
  }

  if (!showAndroid && !showIOS) return null;

  return (
    <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[100] p-3">
      <div className="max-w-md mx-auto rounded-[14px] bg-primary-container border border-primary/20 p-4 shadow-[0_8px_24px_rgba(255,107,107,0.3)] flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
          <Download size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[14px] text-on-primary-container">
            ¡Instala Roomi para Notificaciones!
          </p>
          <p className="text-[12px] text-on-primary-container/70 mt-0.5">
            {showIOS 
              ? "Para recibir notificaciones, instala la app tocando el botón 'Compartir' de Safari y luego 'Agregar a Inicio'."
              : "Instala la app en tu celular para tener acceso rápido y activar las notificaciones push."}
          </p>
          <div className="flex gap-2 mt-3 items-center flex-wrap">
            {showAndroid && (
              <button
                onClick={handleInstallAndroid}
                disabled={installing}
                className="px-4 py-2 rounded-pill bg-primary text-on-primary text-[13px] font-bold"
              >
                {installing ? "..." : "Instalar App"}
              </button>
            )}
            {showIOS && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-primary/10 text-primary text-[12px] font-bold">
                <Share size={14} /> Compartir &gt; Agregar a Inicio
              </div>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-pill text-on-primary-container/60 text-[13px] font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
