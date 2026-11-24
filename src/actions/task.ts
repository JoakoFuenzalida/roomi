"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { taskSchema } from "@/lib/validators";
import { computeInitialDueDate } from "@/lib/rotation";
import { revalidatePath } from "next/cache";
import { TaskFrequency } from "@/generated/prisma/client";
import { sendPushToUser } from "@/lib/push";
import { EFFORT_POINTS, isPersonal } from "@/lib/effort";
import { completeTask } from "@/lib/complete-task";

export async function createTask(
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

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

  const participantIdsRaw = formData
    .getAll("participantIds")
    .map(String)
    .filter((id) => activeMemberships.some((m) => m.id === id));
  const participantIds = participantIdsRaw.length > 0 ? participantIdsRaw : activeMemberships.map(m => m.id);
  const effortPoints = isPersonal(participantIds.length) ? 0 : membership.role === "ADMIN" ? points : 1;

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
      points: effortPoints,
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
  return { success: true, ts: Date.now() };
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

export async function setTaskEffort(taskId: string, householdId: string, points: number) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);
  if (membership.role !== "ADMIN") return { error: "Solo un admin puede cambiar el esfuerzo" };
  if (!EFFORT_POINTS.includes(points)) return { error: "Esfuerzo inválido" };

  await db.task.update({
    where: { id: taskId, householdId },
    data: { points },
  });

  revalidatePath("/tareas");
  revalidatePath("/hoy");
  return { success: true };
}

export async function completarTarea(taskId: string, expectedCycle: number) {
  const user = await requireUser();
  return completeTask(user, taskId, expectedCycle);
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
