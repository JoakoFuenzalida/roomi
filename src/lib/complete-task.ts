import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertMemberOf } from "@/lib/session";
import { computeNextDueDate } from "@/lib/rotation";
import { sendPushToHousehold } from "@/lib/push";
import { isPersonal } from "@/lib/effort";
import { Prisma } from "@/generated/prisma/client";

export async function completeTask(
  user: { id: string; name: string },
  taskId: string,
  expectedCycle: number,
) {
  const task = await db.task.findUnique({
    where: { id: taskId, active: true },
    select: {
      id: true,
      title: true,
      householdId: true,
      cycleNumber: true,
      nextAssigneeMembershipId: true,
      nextAssignee: { select: { userId: true } },
      points: true,
      frequency: true,
      nextDueDate: true,
      daysOfWeek: true,
      daysOfMonth: true,
      participants: { orderBy: { order: "asc" } },
    },
  });

  const alreadyDone = { error: "Esta tarea ya se marcó como hecha" } as const;
  if (!task || task.cycleNumber !== expectedCycle) return alreadyDone;

  const membership = await assertMemberOf(user.id, task.householdId);
  const wasAssigned = task.nextAssigneeMembershipId === membership.id;
  const pointsEarned = isPersonal(task.participants.length)
    ? 0
    : wasAssigned
      ? task.points
      : Math.ceil(task.points * 1.5);

  try {
    await db.$transaction(async (tx) => {
      await tx.taskExecution.create({
        data: {
          taskId,
          cycleNumber: task.cycleNumber,
          completedById: user.id,
          assignedToUserId: task.nextAssignee?.userId,
          wasAssigned,
          pointsEarned,
        },
      });

      if (task.frequency === "ONCE") {
        await tx.task.update({ where: { id: taskId }, data: { active: false } });
        return;
      }

      const activeFilter = {
        leftAt: null,
        OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() } }],
      };
      let rotation: string[];
      if (task.participants.length > 0) {
        const active = await tx.membership.findMany({
          where: { id: { in: task.participants.map((p) => p.membershipId) }, ...activeFilter },
          select: { id: true },
        });
        rotation = task.participants
          .map((p) => p.membershipId)
          .filter((id) => active.some((m) => m.id === id));
      } else {
        const active = await tx.membership.findMany({
          where: { householdId: task.householdId, ...activeFilter },
          orderBy: { rotationOrder: "asc" },
          select: { id: true },
        });
        rotation = active.map((m) => m.id);
      }

      let nextAssigneeId = task.nextAssigneeMembershipId;
      if (rotation.length > 0) {
        const currentIndex = rotation.indexOf(task.nextAssigneeMembershipId ?? "");
        nextAssigneeId = rotation[currentIndex === -1 ? 0 : (currentIndex + 1) % rotation.length];
      }

      await tx.task.update({
        where: { id: taskId },
        data: {
          nextAssigneeMembershipId: nextAssigneeId,
          nextDueDate: computeNextDueDate(task.nextDueDate, task.frequency, task.daysOfWeek, task.daysOfMonth),
          cycleNumber: { increment: 1 },
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return alreadyDone;
    throw e;
  }

  revalidatePath("/hoy");
  revalidatePath("/tareas");

  const notice = await db.notice.create({
    data: {
      householdId: task.householdId,
      authorId: user.id,
      content: `✨ ${user.name} completó la tarea "${task.title}"${pointsEarned > 0 ? ` y ganó ${pointsEarned} RoomiCoins` : ""}.`,
    },
    include: {
      author: { select: { name: true, image: true } },
      reactions: true,
    },
  });

  sendPushToHousehold(
    task.householdId,
    { title: "Tarea completada ✨", body: `${user.name} completó "${task.title}"`, url: "/hoy" },
    user.id,
  ).catch(() => {});

  return { success: true as const, notice, householdId: task.householdId, title: task.title };
}
