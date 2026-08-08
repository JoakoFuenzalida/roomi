"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { AvatarInitials } from "./avatar-initials";
import { sendChatMessage, deleteChatMessage, toggleChatReaction } from "@/actions/chat";
import { Send, Trash2, Heart, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionData = { id: string; userId: string; emoji: string };

export type ChatMessageData = {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  author: { name: string; image: string | null };
  reactions: ReactionData[];
  isOptimistic?: boolean;
};

export function ChatClient({
  householdId,
  currentUserId,
  initialMessages,
  members = [],
}: {
  householdId: string;
  currentUserId: string;
  initialMessages: ChatMessageData[];
  members?: { id: string; name: string | null; image: string | null }[];
}) {
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const closeMenu = useCallback(() => setActiveMenu(null), []);

  useEffect(() => {
    if (!activeMenu) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-context-menu]")) return;
      closeMenu();
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [activeMenu, closeMenu]);

  useEffect(() => {
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "auto" });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const channel = supabase.channel(`room_${householdId}`);

    channel
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        if (payload.message.authorId !== currentUserId) {
          setMessages((prev) => [...prev, payload.message]);
        }
      })
      .on("broadcast", { event: "delete_message" }, ({ payload }) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      })
      .on("broadcast", { event: "toggle_reaction" }, ({ payload }) => {
        const { messageId, userId, emoji, added } = payload;
        if (userId === currentUserId) return;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            let newReactions = [...m.reactions];
            if (added) {
              newReactions.push({ id: Math.random().toString(), userId, emoji });
            } else {
              newReactions = newReactions.filter((r) => !(r.userId === userId && r.emoji === emoji));
            }
            return { ...m, reactions: newReactions };
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, currentUserId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageData = {
      id: tempId,
      content,
      authorId: currentUserId,
      createdAt: new Date(),
      author: { name: "Yo", image: null },
      reactions: [],
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const realMsg = await sendChatMessage(householdId, content);

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...realMsg, isOptimistic: false } : m))
      );

      supabase.channel(`room_${householdId}`).send({
        type: "broadcast",
        event: "new_message",
        payload: { message: realMsg },
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  async function handleDelete(messageId: string) {
    setActiveMenu(null);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    supabase.channel(`room_${householdId}`).send({
      type: "broadcast",
      event: "delete_message",
      payload: { messageId },
    });

    try {
      await deleteChatMessage(messageId, householdId);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReaction(messageId: string) {
    setActiveMenu(null);
    const emoji = "❤️";

    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const msg = messages[msgIndex];
    const hasLiked = msg.reactions.some((r) => r.userId === currentUserId && r.emoji === emoji);
    const added = !hasLiked;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        let newReactions = [...m.reactions];
        if (added) {
          newReactions.push({ id: `temp-r-${Date.now()}`, userId: currentUserId, emoji });
        } else {
          newReactions = newReactions.filter((r) => !(r.userId === currentUserId && r.emoji === emoji));
        }
        return { ...m, reactions: newReactions };
      })
    );

    supabase.channel(`room_${householdId}`).send({
      type: "broadcast",
      event: "toggle_reaction",
      payload: { messageId, userId: currentUserId, emoji, added },
    });

    try {
      await toggleChatReaction(messageId, householdId, emoji);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCopy(content: string) {
    setActiveMenu(null);
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  function handleLongPressStart(msgId: string) {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setActiveMenu(msgId);
    }, 500);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleLongPressMove() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const filteredMembers = mentionQuery !== null
    ? members.filter(m => m.id !== currentUserId && m.name?.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const match = val.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex].name!);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const insertMention = (name: string) => {
    if (mentionQuery === null) return;
    const lastAtIndex = input.lastIndexOf("@" + mentionQuery);
    if (lastAtIndex !== -1) {
      const newValue = input.substring(0, lastAtIndex) + "@" + name + " ";
      setInput(newValue);
    }
    setMentionQuery(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-2">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-semibold">¡Escribe el primer mensaje!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.authorId === currentUserId;
          const likesCount = msg.reactions.filter((r) => r.emoji === "❤️").length;
          const iLiked = msg.reactions.some((r) => r.userId === currentUserId && r.emoji === "❤️");
          const menuOpen = activeMenu === msg.id;

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col w-full", isMine ? "items-end" : "items-start")}
            >
              {!isMine && (
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <AvatarInitials name={msg.author.name} imageUrl={msg.author.image} size={16} />
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    {msg.author.name.split(" ")[0]}
                  </span>
                </div>
              )}

              <div className="relative max-w-[80%]">
                <div
                  className="select-none"
                  onTouchStart={() => !msg.isOptimistic && handleLongPressStart(msg.id)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressMove}
                  onContextMenu={(e) => {
                    if (msg.isOptimistic) return;
                    e.preventDefault();
                    setActiveMenu(msg.id);
                  }}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-[18px] relative transition-colors",
                      isMine
                        ? "bg-primary text-on-primary rounded-tr-[4px]"
                        : "bg-surface-container text-on-surface rounded-tl-[4px]",
                      msg.isOptimistic && "opacity-70",
                      menuOpen && "ring-2 ring-primary/40"
                    )}
                  >
                    <p className="text-[15px] leading-[1.3] whitespace-pre-wrap">{msg.content}</p>

                    {likesCount > 0 && (
                      <div
                        className={cn(
                          "absolute -bottom-2 px-1.5 py-0.5 rounded-full border border-surface-container-lowest bg-surface-container-high flex items-center gap-1 cursor-pointer transition-transform hover:scale-110",
                          isMine ? "-left-2" : "-right-2"
                        )}
                        onClick={() => handleReaction(msg.id)}
                      >
                        <Heart size={12} className={iLiked ? "fill-error text-error" : "text-on-surface-variant"} />
                        <span className="text-[10px] font-bold">{likesCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {menuOpen && (
                  <div
                    data-context-menu
                    className={cn(
                      "absolute z-50 flex items-center gap-0.5 rounded-full bg-surface-container-highest shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-outline-variant/50 p-1 animate-in fade-in zoom-in-95 duration-150",
                      isMine ? "right-0 bottom-full mb-2" : "left-0 bottom-full mb-2"
                    )}
                  >
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <Copy size={15} />
                      Copiar
                    </button>
                    <button
                      onClick={() => handleReaction(msg.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <Heart size={15} className={iLiked ? "fill-error text-error" : ""} />
                      {iLiked ? "Quitar" : "Me gusta"}
                    </button>
                    {isMine && !msg.isOptimistic && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold text-error hover:bg-error-container transition-colors"
                      >
                        <Trash2 size={15} />
                        Borrar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[calc(62px+env(safe-area-inset-bottom))] z-20 bg-surface-container-lowest border-t border-outline-variant">
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 w-full bg-surface-container border-t border-outline-variant rounded-t-[16px] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] max-h-[200px] overflow-y-auto">
            {filteredMembers.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => insertMention(m.name!)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-high transition-colors border-b border-outline-variant/30 last:border-0",
                  i === mentionIndex && "bg-surface-container-high"
                )}
              >
                <AvatarInitials name={m.name!} imageUrl={m.image} size={28} />
                <span className="font-semibold text-[15px]">{m.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="p-3">
          <form onSubmit={handleSend} className="flex gap-2 items-end relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Mensaje"
              className="w-full bg-surface-container rounded-[20px] pl-4 pr-12 py-3 max-h-[100px] min-h-[46px] resize-none text-[15px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 bottom-1.5 w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-full disabled:opacity-50 transition-opacity"
            >
              <Send size={15} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
