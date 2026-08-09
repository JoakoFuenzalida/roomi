"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type MuteDuration = "24h" | "1w" | "forever" | null;

export async function setPushMute(duration: MuteDuration) {
  const user = await requireUser();

  let mutedUntil: Date | null = null;

  if (duration === "24h") {
    mutedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (duration === "1w") {
    mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (duration === "forever") {
    mutedUntil = new Date("9999-12-31T23:59:59Z");
  }

  await db.user.update({
    where: { id: user.id },
    data: { pushMutedUntil: mutedUntil },
  });

  revalidatePath("/perfil");
  return { success: true };
}
