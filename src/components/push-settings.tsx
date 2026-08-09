"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Check, AlertCircle } from "lucide-react";
import { setPushMute, type MuteDuration } from "@/actions/push-mute";
import { cn } from "@/lib/utils";

type PermissionState = "checking" | "unsupported" | "denied" | "default" | "granted";

export function PushSettings({
  vapidPublicKey,
  mutedUntil,
}: {
  vapidPublicKey: string;
  mutedUntil: Date | null;
}) {
  const [permission, setPermission] = useState<PermissionState>("checking");
  const [subscribing, setSubscribing] = useState(false);
  const [pending, startTransition] = useTransition();

  const isForever =
    mutedUntil !== null && mutedUntil.getFullYear() >= 9999;
  const isMutedTemporary =
    mutedUntil !== null && !isForever && mutedUntil > new Date();
  const isMuted = isForever || isMutedTemporary;

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  async function handleEnable() {
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm === "granted") {
        await subscribePush(vapidPublicKey);
        if (isMuted) {
          startTransition(async () => {
            await setPushMute(null);
          });
        }
      }
    } finally {
      setSubscribing(false);
    }
  }

  function handleMute(duration: MuteDuration) {
    startTransition(async () => {
      await setPushMute(duration);
    });
  }

  if (permission === "checking") {
    return (
      <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-4">
        <p className="text-[13px] text-on-surface-variant">Cargando...</p>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-on-surface-variant shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold">No soportadas</p>
          <p className="text-[12px] text-on-surface-variant mt-0.5">
            Tu navegador no soporta notificaciones push.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-[14px] bg-warning-container/30 border border-warning-container p-4 flex items-start gap-3">
        <BellOff size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold">Bloqueadas por el navegador</p>
          <p className="text-[12px] text-on-surface-variant mt-0.5">
            Actívalas desde la configuración de tu navegador (candado en la barra de dirección) y recarga.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "default") {
    return (
      <div className="rounded-[14px] bg-primary-container border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[14px] text-on-primary-container">
              Activa las notificaciones
            </p>
            <p className="text-[12px] text-on-primary-container/70 mt-0.5">
              Te avisamos cuando te toque una tarea o alguien compre algo.
            </p>
            <button
              onClick={handleEnable}
              disabled={subscribing}
              className="mt-3 px-4 py-2 rounded-pill bg-primary text-on-primary text-[13px] font-bold disabled:opacity-50"
            >
              {subscribing ? "Activando..." : "Activar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // permission === "granted"
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "rounded-[14px] border p-4 flex items-start gap-3",
          isMuted
            ? "bg-warning-container/30 border-warning-container"
            : "bg-success-container/30 border-success-container",
        )}
      >
        {isMuted ? (
          <BellOff size={18} className="text-warning shrink-0 mt-0.5" />
        ) : (
          <Check size={18} className="text-success shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-[13px] font-semibold">
            {isForever
              ? "Silenciadas para siempre"
              : isMutedTemporary
                ? `Silenciadas hasta ${formatDate(mutedUntil!)}`
                : "Activas"}
          </p>
          <p className="text-[12px] text-on-surface-variant mt-0.5">
            {isMuted
              ? "No recibirás notificaciones durante este período."
              : "Recibes todas las notificaciones del hogar."}
          </p>
        </div>
      </div>

      {isMuted ? (
        <button
          onClick={() => handleMute(null)}
          disabled={pending}
          className="w-full h-11 rounded-pill bg-primary text-on-primary font-bold text-[13px] disabled:opacity-50"
        >
          {pending ? "..." : "Reactivar notificaciones"}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <MuteChip label="24 horas" onClick={() => handleMute("24h")} pending={pending} />
          <MuteChip label="1 semana" onClick={() => handleMute("1w")} pending={pending} />
          <MuteChip label="Siempre" onClick={() => handleMute("forever")} pending={pending} />
        </div>
      )}
    </div>
  );
}

function MuteChip({
  label,
  onClick,
  pending,
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="h-10 rounded-pill border border-outline-variant text-on-surface text-[12px] font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function formatDate(d: Date) {
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));

  if (hours < 24) return `en ${hours}h`;
  const days = Math.round(hours / 24);
  return `en ${days} día${days === 1 ? "" : "s"}`;
}

async function subscribePush(vapidPublicKey: string) {
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
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
