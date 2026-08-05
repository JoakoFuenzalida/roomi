"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function setVacation(
  membershipId: string,
  householdId: string,
  until: string | null,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.id !== membershipId) {
    throw new Error("Solo puedes cambiar tu propio estado de vacaciones");
  }

  const untilDate = until ? new Date(until) : null;

  if (untilDate && untilDate <= new Date()) {
    throw new Error("La fecha debe ser en el futuro");
  }

  await db.membership.update({
    where: { id: membershipId },
    data: { onVacationUntil: untilDate },
  });

  revalidatePath("/perfil");
}
