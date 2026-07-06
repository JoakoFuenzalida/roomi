"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { taskSchema } from "@/lib/validators";
import { addInterval } from "@/lib/rotation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TaskFrequency } from "@/generated/prisma/client";

export async function createTask(householdId: string, prevState: any, formData: FormData) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo los administradores pueden crear tareas" };
  }

  const parse = taskSchema.safeParse({
    title: formData.get("title"),
    frequency: formData.get("frequency"),
    points: formData.get("points"),
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { title, frequency, points } = parse.data;

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

  await db.task.create({
    data: {
      householdId,
      title,
      frequency: frequency as TaskFrequency,
      points,
      active: true,
      nextAssigneeMembershipId: activeMemberships[0].id,
      nextDueDate: new Date(),
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
    },
  });

  if (!task) {
    throw new Error("Tarea no encontrada o inactiva");
  }

  // Ensure user is member of the household
  const membership = await assertMemberOf(user.id, task.householdId);

  await db.$transaction(async (tx) => {
    // 1. Insert Execution
    await tx.taskExecution.create({
      data: {
        taskId,
        cycleNumber: task.cycleNumber,
        completedById: user.id,
        wasAssigned: task.nextAssigneeMembershipId === membership.id,
        pointsEarned: task.points,
      },
    });

    // 2. Calculate next assignee
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
      const currentIndex = activeMembers.findIndex((m) => m.id === task.nextAssigneeMembershipId);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % activeMembers.length;
      nextAssigneeId = activeMembers[nextIndex].id;
    }

    // 3. Update Task
    await tx.task.update({
      where: { id: taskId },
      data: {
        nextAssigneeMembershipId: nextAssigneeId,
        nextDueDate: addInterval(task.nextDueDate, task.frequency),
        cycleNumber: { increment: 1 },
      },
    });
  });

  revalidatePath("/hoy");
  revalidatePath("/tareas");
}
