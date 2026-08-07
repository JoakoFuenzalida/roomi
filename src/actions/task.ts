"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { taskSchema } from "@/lib/validators";
import { computeInitialDueDate, computeNextDueDate } from "@/lib/rotation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TaskFrequency } from "@/generated/prisma/client";
import { sendPushToHousehold, sendPushToUser } from "@/lib/push";

export async function createTask(
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const daysOfWeekRaw = formData
    .getAll("daysOfWeek")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  const daysOfMonthRaw = formData
    .getAll("daysOfMonth")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31);

  const parse = taskSchema.safeParse({
    title: formData.get("title"),
    frequency: formData.get("frequency"),
    points: formData.get("points"),
    daysOfWeek: daysOfWeekRaw,
    daysOfMonth: daysOfMonthRaw,
    onceDate: formData.get("onceDate"),
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { title, frequency, points, daysOfWeek, daysOfMonth, onceDate } = parse.data;

  const activeMemberships = await db.membership.findMany({
    where: {
      householdId,
      leftAt: null,
      OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() } }],
    },
    orderBy: { rotationOrder: "asc" },
  });

  if (activeMemberships.length === 0) {
    return { error: "No hay miembros activos en el hogar" };
  }

  const participantIdsRaw = formData.getAll("participantIds").map(String);
  const participantIds = participantIdsRaw.length > 0 ? participantIdsRaw : activeMemberships.map(m => m.id);

  let nextDueDate: Date;
  if (frequency === "ONCE" && onceDate) {
    nextDueDate = new Date(onceDate);
  } else {
    nextDueDate = computeInitialDueDate(
      frequency as TaskFrequency,
      daysOfWeek,
      daysOfMonth,
    );
  }

  await db.task.create({
    data: {
      householdId,
      title,
      frequency: frequency as TaskFrequency,
      points,
      daysOfWeek,
      daysOfMonth,
      active: true,
      nextAssigneeMembershipId: participantIds[0],
      nextDueDate,
      cycleNumber: 0,
      participants: {
        create: participantIds.map((id, index) => ({
          membershipId: id,
          order: index,
        })),
      },
    },
  });

  revalidatePath("/tareas");
  revalidatePath("/hoy");
  redirect(`/tareas?hogarId=${householdId}`);
}

export async function deleteTask(taskId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden eliminar tareas");
  }

  await db.task.update({
    where: { id: taskId, householdId },
    data: { active: false },
  });

  revalidatePath("/tareas");
  revalidatePath("/hoy");
}

export async function completarTarea(taskId: string) {
  const user = await requireUser();

  const task = await db.task.findUnique({
    where: { id: taskId, active: true },
    select: {
      id: true,
      householdId: true,
      cycleNumber: true,
      nextAssigneeMembershipId: true,
      points: true,
      frequency: true,
      nextDueDate: true,
      daysOfWeek: true,
      daysOfMonth: true,
      participants: {
        orderBy: { order: "asc" }
      }
    },
  });

  if (!task) {
    throw new Error("Tarea no encontrada o inactiva");
  }

  const membership = await assertMemberOf(user.id, task.householdId);

  await db.$transaction(async (tx) => {
    await tx.taskExecution.create({
      data: {
        taskId,
        cycleNumber: task.cycleNumber,
        completedById: user.id,
        wasAssigned: task.nextAssigneeMembershipId === membership.id,
        pointsEarned: task.nextAssigneeMembershipId === membership.id ? task.points : Math.ceil(task.points * 1.5),
      },
    });

    let nextAssigneeId = task.nextAssigneeMembershipId;

    if (task.participants && task.participants.length > 0) {
      // Use explicit participants rotation
      const activeParticipants = task.participants.filter(p => {
        // Here we'd need to fetch memberships to check if they left or are on vacation.
        // Actually, let's fetch active members and filter the participants list.
        return true; // We'll compute this in the next block
      });
      
      const activeMembers = await tx.membership.findMany({
        where: {
          id: { in: task.participants.map(p => p.membershipId) },
          leftAt: null,
          OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() } }],
        }
      });
      
      // Filter out participants who are not active
      const validParticipants = task.participants.filter(p => activeMembers.some(m => m.id === p.membershipId));

      if (validParticipants.length > 0) {
        const currentIndex = validParticipants.findIndex(
          (p) => p.membershipId === task.nextAssigneeMembershipId,
        );
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + 1) % validParticipants.length;
        nextAssigneeId = validParticipants[nextIndex].membershipId;
      }

    } else {
      // Fallback to global rotation
      const activeMembers = await tx.membership.findMany({
        where: {
          householdId: task.householdId,
          leftAt: null,
          OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() } }],
        },
        orderBy: { rotationOrder: "asc" },
      });

      if (activeMembers.length > 0) {
        const currentIndex = activeMembers.findIndex(
          (m) => m.id === task.nextAssigneeMembershipId,
        );
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + 1) % activeMembers.length;
        nextAssigneeId = activeMembers[nextIndex].id;
      }
    }

    if (task.frequency === "ONCE") {
      await tx.task.update({
        where: { id: taskId },
        data: {
          active: false,
        },
      });
    } else {
      await tx.task.update({
        where: { id: taskId },
        data: {
          nextAssigneeMembershipId: nextAssigneeId,
          nextDueDate: computeNextDueDate(
            task.nextDueDate,
            task.frequency,
            task.daysOfWeek,
            task.daysOfMonth,
          ),
          cycleNumber: { increment: 1 },
        },
      });
    }
  });

  revalidatePath("/hoy");
  revalidatePath("/tareas");

  const taskData = await db.task.findUnique({
    where: { id: taskId },
    select: { title: true, householdId: true },
  });
  if (taskData) {
    sendPushToHousehold(
      taskData.householdId,
      {
        title: "Tarea completada ✨",
        body: `${user.name} completó "${taskData.title}"`,
        url: "/hoy",
      },
      user.id,
    ).catch(() => {});
  }
}

export async function swapTurno(taskId: string, toMembershipId: string) {
  const user = await requireUser();

  const task = await db.task.findUnique({
    where: { id: taskId, active: true },
    select: {
      id: true,
      title: true,
      householdId: true,
      nextAssigneeMembershipId: true,
    },
  });

  if (!task) throw new Error("Tarea no encontrada");

  const myMembership = await assertMemberOf(user.id, task.householdId);

  if (task.nextAssigneeMembershipId !== myMembership.id) {
    throw new Error("Solo el asignado actual puede intercambiar");
  }

  const target = await db.membership.findUnique({
    where: { id: toMembershipId, householdId: task.householdId, leftAt: null },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });

  if (!target) throw new Error("Miembro no encontrado");

  await db.task.update({
    where: { id: taskId },
    data: { nextAssigneeMembershipId: toMembershipId },
  });

  revalidatePath("/tareas");
  revalidatePath("/hoy");

  sendPushToUser(target.userId, {
    title: "Te pasaron una tarea 🔄",
    body: `${user.name} te pasó "${task.title}"`,
    url: "/tareas",
  }).catch(() => {});
}
