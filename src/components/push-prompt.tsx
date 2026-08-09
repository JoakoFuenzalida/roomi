"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function PushPrompt({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Check if on iOS and NOT standalone. If so, push notifications aren't supported yet, 
    // we must wait for them to install the PWA.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    
    if (isIOS && !isStandalone) {
      return; // Can't request push on iOS Safari until installed as PWA
    }

    if (Notification.permission === "granted") {
      subscribeQuietly(vapidPublicKey);
      return;
    }
    
    if (Notification.permission === "default") {
      // Force it to show, ignoring previous dismissals to be more aggressive
      setShow(true);
    }
  }, [vapidPublicKey]);

  async function handleEnable() {
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribeQuietly(vapidPublicKey);
      }
    } finally {
      setSubscribing(false);
      setShow(false);
    }
  }

  function handleDismiss() {
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-[calc(70px+env(safe-area-inset-bottom))] left-4 right-4 z-50 max-w-md mx-auto">
      <div className="rounded-[14px] bg-primary-container border border-primary/20 p-4 shadow-[0_8px_24px_rgba(255,107,107,0.2)] flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
          <Bell size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[14px] text-on-primary-container">
            Activa las notificaciones
          </p>
          <p className="text-[12px] text-on-primary-container/70 mt-0.5">
            Te avisamos cuando te toque limpiar o alguien compre algo.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={subscribing}
              className="px-4 py-2 rounded-pill bg-primary text-on-primary text-[13px] font-bold"
            >
              {subscribing ? "..." : "Activar"}
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

async function subscribeQuietly(vapidPublicKey: string) {
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const subJson = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      }),
    });
  } catch {}
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
