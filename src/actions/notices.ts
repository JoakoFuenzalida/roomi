"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { noticeSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { sendPushToHousehold } from "@/lib/push";

export async function crearAviso(
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const parse = noticeSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  await db.notice.create({
    data: {
      householdId,
      authorId: user.id,
      content: parse.data.content,
    },
  });

  revalidatePath("/hoy");

  sendPushToHousehold(
    householdId,
    {
      title: `${user.name} publicó un aviso 📌`,
      body: parse.data.content.slice(0, 100),
      url: "/hoy",
    },
    user.id,
  ).catch(() => {});

  return { success: true, ts: Date.now() };
}

export async function eliminarAviso(noticeId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const notice = await db.notice.findUnique({
    where: { id: noticeId },
    select: { authorId: true, householdId: true },
  });

  if (!notice || notice.householdId !== householdId) {
    throw new Error("Aviso no encontrado");
  }

  const membership = await assertMemberOf(user.id, householdId);
  if (notice.authorId !== user.id && membership.role !== "ADMIN") {
    throw new Error("Solo el autor o admin puede eliminar");
  }

  await db.notice.delete({ where: { id: noticeId } });
  revalidatePath("/hoy");
}

export async function togglePin(noticeId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede fijar avisos");
  }

  const notice = await db.notice.findUnique({
    where: { id: noticeId, householdId },
    select: { pinned: true },
  });

  if (!notice) throw new Error("Aviso no encontrado");

  await db.notice.update({
    where: { id: noticeId },
    data: { pinned: !notice.pinned },
  });

  revalidatePath("/hoy");
}

export async function toggleReaction(
  noticeId: string,
  householdId: string,
  emoji: string,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const existing = await db.reaction.findUnique({
    where: {
      noticeId_userId_emoji: { noticeId, userId: user.id, emoji },
    },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else {
    await db.reaction.create({
      data: { noticeId, userId: user.id, emoji },
    });
  }

  revalidatePath("/hoy");
}

export async function getNotices(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  return db.notice.findMany({
    where: { householdId },
    include: {
      author: { select: { id: true, name: true } },
      reactions: {
        select: { id: true, emoji: true, userId: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}
