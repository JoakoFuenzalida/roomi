"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const activeChannels = new Map<string, RealtimeChannel>();

function getChannel(householdId: string) {
  const key = `sync_${householdId}`;
  let channel = activeChannels.get(key);
  if (!channel) {
    channel = supabase.channel(key, {
      config: { broadcast: { self: true } },
    });
    channel.subscribe();
    activeChannels.set(key, channel);
  }
  return channel;
}

export function broadcastUpdate(householdId: string) {
  const channel = getChannel(householdId);
  channel.send({
    type: "broadcast",
    event: "data_changed",
    payload: { ts: Date.now() },
  });
}

export function RealtimeRefresh({ householdId }: { householdId: string }) {
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = getChannel(householdId);

    const handler = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        router.refresh();
      }, 300);
    };

    channel.on("broadcast", { event: "data_changed" }, handler);

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [householdId, router]);

  return null;
}
