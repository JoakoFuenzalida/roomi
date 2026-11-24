// Equivalente server-side de broadcastUpdate/broadcastNotice, para cuando no hay un cliente
// abierto que avise (p. ej. "Listo" desde una notificación).
export async function broadcastFromServer(householdId: string, notice?: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const messages = [
    { topic: `sync_${householdId}`, event: "data_changed", payload: { ts: Date.now() }, private: false },
    ...(notice
      ? [{ topic: `room_${householdId}`, event: "new_message", payload: { message: notice, isSystem: true }, private: false }]
      : []),
  ];

  await fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  }).catch(() => {});
}
