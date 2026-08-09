"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export function broadcastUpdate(householdId: string) {
  supabase.channel(`sync_${householdId}`).send({
    type: "broadcast",
    event: "data_changed",
    payload: { ts: Date.now() },
  });
}

export function RealtimeRefresh({ householdId }: { householdId: string }) {
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`sync_${householdId}`);

    channel
      .on("broadcast", { event: "data_changed" }, () => {
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
          router.refresh();
        }, 300);
      })
      .subscribe();

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  return null;
}
