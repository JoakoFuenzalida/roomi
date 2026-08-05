"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { shoppingItemSchema, marcarCompradoSchema } from "@/lib/validators";
import { computeInitialDueDate, computeNextDueDate } from "@/lib/rotation";
import { revalidatePath } from "next/cache";
import { TaskFrequency } from "@/generated/prisma/client";

export async function agregarItem(
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

  const parse = shoppingItemSchema.safeParse({
    title: formData.get("title"),
    quantity: formData.get("quantity") || undefined,
    isRecurring: formData.get("isRecurring"),
    frequency: formData.get("frequency") || undefined,
    daysOfWeek: daysOfWeekRaw,
    daysOfMonth: daysOfMonthRaw,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { title, quantity, isRecurring, frequency, daysOfWeek, daysOfMonth } =
    parse.data;

  let nextBuyerMembershipId: string | null = null;
  let nextDueDate: Date | null = null;
  let finalFrequency: TaskFrequency | null = null;

  if (isRecurring && frequency) {
    finalFrequency = frequency as TaskFrequency;

    const activeMembers = await db.membership.findMany({
      where: {
        householdId,
        leftAt: null,
        OR: [
          { onVacationUntil: null },
          { onVacationUntil: { lt: new Date() } },
        ],
      },
      orderBy: { rotationOrder: "asc" },
    });

    if (activeMembers.length > 0) {
      nextBuyerMembershipId = activeMembers[0].id;
    }

    nextDueDate = computeInitialDueDate(
      finalFrequency,
      daysOfWeek,
      daysOfMonth,
    );
  }

  await db.shoppingItem.create({
    data: {
      householdId,
      title,
      quantity: quantity || null,
      createdById: user.id,
      frequency: finalFrequency,
      daysOfWeek: isRecurring ? daysOfWeek : [],
      daysOfMonth: isRecurring ? daysOfMonth : [],
      nextBuyerMembershipId,
      nextDueDate,
    },
  });

  revalidatePath("/compras");
  return { success: true, ts: Date.now() };
}

export async function marcarComprado(
  itemId: string,
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const excludedRaw = formData.getAll("excludedUserIds").map(String);

  const parse = marcarCompradoSchema.safeParse({
    amount: formData.get("amount"),
    excludedUserIds: excludedRaw,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { amount, excludedUserIds } = parse.data;

  const item = await db.shoppingItem.findUnique({
    where: { id: itemId, householdId, active: true },
  });

  if (!item) {
    return { error: "Item no encontrado" };
  }

  await db.$transaction(async (tx) => {
    const activeMembers = await tx.membership.findMany({
      where: {
        householdId,
        leftAt: null,
        OR: [
          { onVacationUntil: null },
          { onVacationUntil: { lt: new Date() } },
        ],
      },
      include: { user: { select: { id: true } } },
      orderBy: { rotationOrder: "asc" },
    });

    const payers = activeMembers
      .map((m) => m.user.id)
      .filter((uid) => !excludedUserIds.includes(uid));

    if (payers.length === 0) {
      throw new Error("Debe haber al menos un participante en el gasto");
    }

    const perPerson = Math.floor(amount / payers.length);
    const remainder = amount - perPerson * payers.length;

    const expense = await tx.expense.create({
      data: {
        householdId,
        payerId: user.id,
        amount,
        title: item.title,
        shoppingItemId: item.id,
        splits: {
          create: payers.map((uid, i) => ({
            userId: uid,
            amount: perPerson + (i < remainder ? 1 : 0),
          })),
        },
      },
    });

    if (item.frequency) {
      const nextDueDate = computeNextDueDate(
        item.nextDueDate!,
        item.frequency,
        item.daysOfWeek,
        item.daysOfMonth,
      );

      let nextBuyerId = item.nextBuyerMembershipId;
      if (activeMembers.length > 0) {
        const currentIdx = activeMembers.findIndex(
          (m) => m.id === item.nextBuyerMembershipId,
        );
        const nextIdx =
          currentIdx === -1 ? 0 : (currentIdx + 1) % activeMembers.length;
        nextBuyerId = activeMembers[nextIdx].id;
      }

      await tx.shoppingItem.update({
        where: { id: itemId },
        data: {
          nextDueDate,
          nextBuyerMembershipId: nextBuyerId,
          cycleNumber: { increment: 1 },
        },
      });
    } else {
      await tx.shoppingItem.update({
        where: { id: itemId },
        data: {
          checkedById: user.id,
          checkedAt: new Date(),
        },
      });
    }
  });

  revalidatePath("/compras");
  return { success: true, ts: Date.now() };
}

export async function eliminarItem(itemId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  await db.shoppingItem.update({
    where: { id: itemId, householdId },
    data: { active: false },
  });

  revalidatePath("/compras");
}
