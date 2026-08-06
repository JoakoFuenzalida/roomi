"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatClient } from "@/components/chat";

export function HoyTabs({
  mainHouseholdId,
  currentUserId,
  chatMessages,
  children,
}: {
  mainHouseholdId: string;
  currentUserId: string;
  chatMessages: any[];
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState<"muro" | "chat">("muro");

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
    </>
  );
}
