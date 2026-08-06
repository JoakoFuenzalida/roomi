"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";

export async function sendChatMessage(householdId: string, content: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const notice = await db.notice.create({
    data: {
      householdId,
      authorId: user.id,
      content,
    },
    include: {
      author: { select: { name: true, image: true } },
      reactions: true,
    },
  });

  return notice;
}

export async function deleteChatMessage(messageId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const notice = await db.notice.findUnique({ where: { id: messageId } });
  if (!notice) return;
  
  if (notice.authorId !== user.id) {
    throw new Error("No puedes borrar mensajes de otros");
  }

  await db.notice.delete({ where: { id: messageId } });
}

export async function toggleChatReaction(messageId: string, householdId: string, emoji: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const existing = await db.reaction.findUnique({
    where: {
      noticeId_userId_emoji: {
        noticeId: messageId,
        userId: user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { added: false };
  } else {
    await db.reaction.create({
      data: {
        noticeId: messageId,
        userId: user.id,
        emoji,
      },
    });
    return { added: true };
  }
}
