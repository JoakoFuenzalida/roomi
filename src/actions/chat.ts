"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";

import { sendPushToUser } from "@/lib/push";

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

  // Notify other members
  const members = await db.membership.findMany({
    where: { householdId, userId: { not: user.id } },
    include: { user: { select: { id: true, name: true } } },
  });

  for (const m of members) {
    const isMentioned = m.user.name && notice.content.includes(`@${m.user.name}`);
    if (!m.chatMuted || isMentioned) {
      await sendPushToUser(m.userId, {
        title: isMentioned ? `Te mencionaron en el chat 💬` : `Nuevo mensaje de ${user.name}`,
        body: notice.content.length > 50 ? notice.content.substring(0, 47) + "..." : notice.content,
        url: "/hoy",
      }).catch(() => {});
    }
  }

  return notice;
}

export async function deleteChatMessage(messageId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const notice = await db.notice.findUnique({ where: { id: messageId } });
  if (!notice) return;

  if (notice.householdId !== householdId) {
    throw new Error("Mensaje no pertenece a este hogar");
  }

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
