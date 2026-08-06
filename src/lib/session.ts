import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return user;
}

export async function assertMemberOf(userId: string, householdId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_householdId: { userId, householdId } },
    select: { id: true, role: true, leftAt: true },
  });
  if (!membership || membership.leftAt !== null) {
    throw new Error("No perteneces a este hogar");
  }
  return membership;
}
