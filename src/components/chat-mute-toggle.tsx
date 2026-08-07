"use client";

import { useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { toggleChatMute } from "@/actions/chat-mute";

type MembershipChatMute = {
  id: string;
  householdId: string;
  householdName: string;
  chatMuted: boolean;
};

export function ChatMuteToggle({
  memberships,
}: {
  memberships: MembershipChatMute[];
}) {
  return (
    <ul className="space-y-2">
      {memberships.map((m) => (
        <ChatMuteRow key={m.id} membership={m} />
      ))}
    </ul>
  );
}

function ChatMuteRow({ membership }: { membership: MembershipChatMute }) {
  const isMuted = membership.chatMuted;
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() =>
      toggleChatMute(membership.id, membership.householdId, !isMuted),
    );
  }

  return (
    <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isMuted
                ? "bg-surface-container text-on-surface-variant"
                : "bg-primary-container text-primary"
            }`}
          >
            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
          </div>
          <div>
            <p className="text-[14px] font-semibold">
              {membership.householdName}
            </p>
            <p className="text-[12px] text-on-surface-variant font-semibold">
              {isMuted ? "Notificaciones silenciadas" : "Notificaciones activadas"}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={pending}
          className={`px-3 py-1.5 rounded-pill text-[12px] font-bold transition-colors disabled:opacity-50 ${
            isMuted
              ? "bg-primary text-on-primary"
              : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          {isMuted ? "Activar" : "Silenciar"}
        </button>
      </div>
    </div>
  );
}
