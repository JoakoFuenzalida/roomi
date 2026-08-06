"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { Pin, Trash2, Plus } from "lucide-react";
import { AvatarInitials } from "./avatar-initials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  crearAviso,
  eliminarAviso,
  togglePin,
  toggleReaction,
} from "@/actions/notices";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "👀", "🔥", "✅"];

type NoticeType = {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: Date;
  author: { id: string; name: string };
  reactions: { id: string; emoji: string; userId: string }[];
};

function timeAgo(d: Date) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

function groupReactions(reactions: NoticeType["reactions"]) {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const list = map.get(r.emoji) ?? [];
    list.push(r.userId);
    map.set(r.emoji, list);
  }
  return map;
}

export function NoticeCard({
  notice,
  householdId,
  currentUserId,
  isAdmin,
}: {
  notice: NoticeType;
  householdId: string;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const grouped = groupReactions(notice.reactions);

  const canDelete = notice.author.id === currentUserId || isAdmin;

  return (
    <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <AvatarInitials name={notice.author.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold truncate">
              {notice.author.name}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {timeAgo(notice.createdAt)}
            </span>
            {notice.pinned && (
              <span className="text-[11px] text-primary font-bold flex items-center gap-0.5">
                <Pin size={11} /> Fijado
              </span>
            )}
          </div>
          <p className="text-[14px] text-on-surface mt-1 whitespace-pre-wrap break-words">
            {notice.content}
          </p>
        </div>

        {canDelete && (
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(() => togglePin(notice.id, householdId))
                }
                className={`p-1.5 rounded-full transition-colors ${
                  notice.pinned
                    ? "text-primary bg-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <Pin size={14} />
              </button>
            )}
            <button
              disabled={pending}
              onClick={() =>
                startTransition(() => eliminarAviso(notice.id, householdId))
              }
              className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="flex flex-wrap gap-1.5 mt-3 ml-[48px]">
        {Array.from(grouped.entries()).map(([emoji, userIds]) => {
          const isMine = userIds.includes(currentUserId);
          return (
            <button
              key={emoji}
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  toggleReaction(notice.id, householdId, emoji),
                )
              }
              className={`flex items-center gap-1 px-2 py-0.5 rounded-pill text-[13px] border transition-colors ${
                isMine
                  ? "bg-primary-container border-primary text-on-primary-container"
                  : "bg-surface-container border-outline-variant text-on-surface"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[11px] font-semibold">{userIds.length}</span>
            </button>
          );
        })}

        {/* Quick-add emoji buttons */}
        {QUICK_EMOJIS.filter((e) => !grouped.has(e)).slice(0, 3).map((emoji) => (
          <button
            key={emoji}
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                toggleReaction(notice.id, householdId, emoji),
              )
            }
            className="px-1.5 py-0.5 rounded-pill text-[13px] border border-dashed border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors opacity-50 hover:opacity-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NewNoticeSheet({
  householdId,
}: {
  householdId: string;
}) {
  const [open, setOpen] = useState(false);
  const action = crearAviso.bind(null, householdId);
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state && "success" in state) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_20px_rgba(255,107,107,0.45)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Nuevo aviso"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-[20px] px-5 pb-8">
          <SheetHeader>
            <SheetTitle className="font-display text-lg">
              Nuevo aviso
            </SheetTitle>
            <SheetDescription>
              Todos en el hogar lo verán.
            </SheetDescription>
          </SheetHeader>

          <form action={formAction} className="space-y-4">
            <div>
              <textarea
                name="content"
                rows={3}
                maxLength={500}
                placeholder="Escribe tu aviso..."
                className="w-full rounded-[12px] border border-outline-variant bg-surface-container-low px-4 py-3 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {state && "error" in state && (
              <p className="text-error text-sm">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-pill bg-primary text-on-primary font-bold text-[15px] disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Publicando..." : "Publicar"}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
