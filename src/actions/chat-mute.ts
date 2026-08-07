"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleChatMute(membershipId: string, householdId: string, muted: boolean) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  // Validate the membership belongs to the user
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership || membership.userId !== user.id || membership.householdId !== householdId) {
    throw new Error("No puedes silenciar notificaciones de otras personas u hogares.");
  }

  await db.membership.update({
    where: { id: membershipId },
    data: { chatMuted: muted },
  });

  revalidatePath("/perfil");
}
