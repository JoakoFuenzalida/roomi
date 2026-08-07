"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatClient } from "@/components/chat";
import { AvatarInitials } from "@/components/avatar-initials";
import Image from "next/image";

type RankingUser = {
  user: { id: string; name: string | null; image: string | null };
  points: number;
};

function getTitle(points: number) {
  if (points <= 10) return { title: "El Fantasma", icon: "👻" };
  if (points <= 30) return { title: "Roomie Promedio", icon: "🧍" };
  if (points <= 50) return { title: "Máquina de Limpieza", icon: "🧹" };
  return { title: "Dios del Hogar", icon: "👑" };
}

export function HoyTabs({
  mainHouseholdId,
  currentUserId,
  chatMessages,
  rankingData,
  initialTab = "muro",
  children,
}: {
  mainHouseholdId: string;
  currentUserId: string;
  chatMessages: any[];
  rankingData: RankingUser[];
  initialTab?: "muro" | "chat" | "ranking";
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState<"muro" | "chat" | "ranking">(initialTab);

  return (
    <>
      <div className="flex bg-surface-container-high rounded-[14px] p-1 mb-6 shrink-0">
        <button
          onClick={() => setTab("muro")}
          className={cn(
            "flex-1 text-center py-2.5 rounded-[10px] font-semibold text-[14px] transition-colors",
            tab === "muro" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Muro
        </button>
        <button
          onClick={() => setTab("chat")}
          className={cn(
            "flex-1 text-center py-2.5 rounded-[10px] font-semibold text-[14px] transition-colors",
            tab === "chat" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Chat en vivo
        </button>
        <button
          onClick={() => setTab("ranking")}
          className={cn(
            "flex-1 text-center py-2.5 rounded-[10px] font-semibold text-[14px] transition-colors",
            tab === "ranking" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Ranking
        </button>
      </div>

      <div className={cn("flex-1 min-h-0 flex flex-col", tab === "muro" ? "block" : "hidden")}>
        {children}
      </div>

      {tab === "chat" && (
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatClient
            householdId={mainHouseholdId}
            currentUserId={currentUserId}
            initialMessages={chatMessages}
          />
        </div>
      )}

      {tab === "ranking" && (
        <div className="flex-1 overflow-y-auto pb-4 space-y-4">
          <div className="mb-6 text-center">
            <h1 className="font-display font-semibold text-[26px] leading-tight">
              Ranking Mensual
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              ¿Quién aporta más este mes?
            </p>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-[16px] overflow-hidden">
            {rankingData.map((r, i) => {
              const { title, icon } = getTitle(r.points);
              const isMe = r.user.id === currentUserId;
              
              return (
                <div
                  key={r.user.id}
                  className={cn(
                    "flex items-center gap-4 p-4 border-b border-outline-variant/50 last:border-b-0",
                    isMe && "bg-primary/5"
                  )}
                >
                  <div className="w-6 text-center font-display font-bold text-lg text-on-surface-variant shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  
                  <AvatarInitials name={r.user.name ?? ""} imageUrl={r.user.image} size={44} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate flex items-center gap-2">
                      {r.user.name} {isMe && <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-bold">Tú</span>}
                    </p>
                    <p className="text-[12px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <span>{icon}</span> {title}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="font-display font-bold text-[18px] text-primary">{r.points}</span>
                      <div className="w-[14px] h-[14px] rounded-full overflow-hidden flex items-center justify-center bg-white">
                        <Image src="/coins.jpeg" alt="RC" width={14} height={14} className="object-cover w-full h-full" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center text-sm text-on-surface-variant px-4 mt-6">
            <p>Se reinicia el 1 de cada mes. ¡El último paga las pizzas! 🍕</p>
          </div>
        </div>
      )}
    </>
  );
}
