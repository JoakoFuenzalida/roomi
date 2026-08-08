"use server";

import { db } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const userId = session.user.id;

  await db.$transaction(async (tx) => {
    await tx.reaction.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });

    await tx.membership.updateMany({
      where: { userId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Usuario eliminado",
        email: `deleted_${userId}@deleted.local`,
        hashedPassword: null,
        image: null,
      },
    });
  });

  await signOut({ redirectTo: "/login" });
}
