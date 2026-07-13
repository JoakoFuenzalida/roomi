"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { taskSchema } from "@/lib/validators";
import { computeInitialDueDate, computeNextDueDate } from "@/lib/rotation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TaskFrequency } from "@/generated/prisma/client";

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
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { title, frequency, points, daysOfWeek, daysOfMonth } = parse.data;

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

  const nextDueDate = computeInitialDueDate(
    frequency as TaskFrequency,
    daysOfWeek,
    daysOfMonth,
  );

  await db.task.create({
    data: {
      householdId,
      title,
      frequency: frequency as TaskFrequency,
      points,
      daysOfWeek,
      daysOfMonth,
      active: true,
      nextAssigneeMembershipId: activeMemberships[0].id,
      nextDueDate,
      cycleNumber: 0,
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
        pointsEarned: task.points,
      },
    });

    const activeMembers = await tx.membership.findMany({
      where: {
        householdId: task.householdId,
        leftAt: null,
        OR: [{ onVacationUntil: null }, { onVacationUntil: { lt: new Date() } }],
      },
      orderBy: { rotationOrder: "asc" },
    });

    let nextAssigneeId = task.nextAssigneeMembershipId;

    if (activeMembers.length > 0) {
      const currentIndex = activeMembers.findIndex(
        (m) => m.id === task.nextAssigneeMembershipId,
      );
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % activeMembers.length;
      nextAssigneeId = activeMembers[nextIndex].id;
    }

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
  });

  revalidatePath("/hoy");
  revalidatePath("/tareas");
}
