"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import {
  householdNameSchema,
  inviteCodeSchema,
} from "@/lib/validators";

export type HouseholdState = { error: string } | null;

async function joinCore(userId: string, code: string) {
  const household = await db.household.findUnique({
    where: { inviteCode: code },
    select: { id: true },
  });
  if (!household) return { ok: false as const, error: "Código no encontrado" };

  const existing = await db.membership.findUnique({
    where: { userId_householdId: { userId, householdId: household.id } },
    select: { id: true, leftAt: true },
  });
  if (existing && existing.leftAt === null) {
    return { ok: false as const, error: "Ya perteneces a este hogar" };
  }

  const last = await db.membership.findFirst({
    where: { householdId: household.id },
    orderBy: { rotationOrder: "desc" },
    select: { rotationOrder: true },
  });
  const nextOrder = (last?.rotationOrder ?? 0) + 1;

  if (existing) {
    await db.membership.update({
      where: { id: existing.id },
      data: { leftAt: null, rotationOrder: nextOrder, joinedAt: new Date() },
    });
  } else {
    await db.membership.create({
      data: {
        userId,
        householdId: household.id,
        role: "MEMBER",
        rotationOrder: nextOrder,
      },
    });
  }
  return { ok: true as const };
}

export async function createHousehold(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const user = await requireUser();
  const parsed = householdNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
  }

  await db.household.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          rotationOrder: 1,
        },
      },
    },
  });

  revalidatePath("/hogar");
  redirect("/hogar");
}

export async function joinHousehold(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const user = await requireUser();
  const parsed = inviteCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido" };
  }

  const result = await joinCore(user.id, parsed.data.code);
  if (!result.ok) return { error: result.error };

  revalidatePath("/hogar");
  redirect("/hogar");
}

export async function joinByCode(code: string) {
  const user = await requireUser();
  const result = await joinCore(user.id, code);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/hogar");
  redirect("/hogar");
}

export async function leaveHousehold(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  await db.membership.update({
    where: { userId_householdId: { userId: user.id, householdId } },
    data: { leftAt: new Date() },
  });

  revalidatePath("/hogar");
  redirect("/hogar");
}

export async function removeMember(householdId: string, userIdToRemove: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  // Validate admin
  const adminMembership = await db.membership.findFirst({
    where: { householdId, userId: user.id, leftAt: null, role: "ADMIN" }
  });
  if (!adminMembership) {
    throw new Error("No tienes permisos para eliminar miembros");
  }

  // Set leftAt
  await db.membership.update({
    where: { userId_householdId: { userId: userIdToRemove, householdId } },
    data: { leftAt: new Date() }
  });

  // Cycle invite code to prevent rejoining
  await db.household.update({
    where: { id: householdId },
    data: { inviteCode: crypto.randomUUID() },
  });

  revalidatePath("/hogar");
}

export async function resetRoomiCoins(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const adminMembership = await db.membership.findFirst({
    where: { householdId, userId: user.id, leftAt: null, role: "ADMIN" }
  });
  if (!adminMembership) {
    throw new Error("No tienes permisos para reiniciar el ranking");
  }

  const executions = await db.taskExecution.findMany({
    where: { task: { householdId } },
    select: { id: true }
  });
  const executionIds = executions.map(e => e.id);

  if (executionIds.length > 0) {
    await db.taskExecution.updateMany({
      where: { id: { in: executionIds } },
      data: { pointsEarned: 0 },
    });
  }

  revalidatePath("/hoy");
  revalidatePath("/hogar");
}
