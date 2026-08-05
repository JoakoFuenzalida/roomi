"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { settlementSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function marcarPagado(
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const parse = settlementSchema.safeParse({
    toUserId: formData.get("toUserId"),
    amount: formData.get("amount"),
    method: formData.get("method") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { toUserId, amount, method, note } = parse.data;

  if (toUserId === user.id) {
    return { error: "No puedes pagarte a ti mismo" };
  }

  await assertMemberOf(toUserId, householdId);

  await db.settlement.create({
    data: {
      householdId,
      fromUserId: user.id,
      toUserId,
      amount,
      method: method || null,
      note: note || null,
      recordedById: user.id,
    },
  });

  revalidatePath("/compras");
  return { success: true, ts: Date.now() };
}

export async function confirmarPago(settlementId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const settlement = await db.settlement.findUnique({
    where: { id: settlementId, householdId },
  });

  if (!settlement) {
    throw new Error("Pago no encontrado");
  }

  if (settlement.toUserId !== user.id) {
    throw new Error("Solo el acreedor puede confirmar el pago");
  }

  if (settlement.confirmedAt) {
    return { error: "Este pago ya fue confirmado" };
  }

  await db.settlement.update({
    where: { id: settlementId },
    data: { confirmedAt: new Date() },
  });

  revalidatePath("/compras");
  return { success: true };
}

export async function reportarErrorPago(
  settlementId: string,
  householdId: string,
) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const settlement = await db.settlement.findUnique({
    where: { id: settlementId, householdId },
  });

  if (!settlement) {
    throw new Error("Pago no encontrado");
  }

  if (settlement.toUserId !== user.id) {
    throw new Error("Solo el acreedor puede reportar error");
  }

  if (settlement.confirmedAt) {
    return { error: "No se puede reportar error en un pago ya confirmado" };
  }

  await db.settlement.delete({
    where: { id: settlementId },
  });

  revalidatePath("/compras");
  return { success: true };
}

export type DebtSummary = {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
};

export async function getBalances(householdId: string): Promise<DebtSummary[]> {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const activeMembers = await db.membership.findMany({
    where: { householdId, leftAt: null },
    include: { user: { select: { id: true, name: true } } },
  });

  const userIds = activeMembers.map((m) => m.user.id);
  const userMap = new Map(activeMembers.map((m) => [m.user.id, m.user.name]));

  const splits = await db.expenseSplit.findMany({
    where: {
      expense: { householdId },
      userId: { in: userIds },
    },
    include: { expense: { select: { payerId: true } } },
  });

  const confirmedSettlements = await db.settlement.findMany({
    where: {
      householdId,
      confirmedAt: { not: null },
      OR: [
        { fromUserId: { in: userIds } },
        { toUserId: { in: userIds } },
      ],
    },
  });

  // net[A][B] > 0 means A owes B that amount
  const net: Record<string, Record<string, number>> = {};
  for (const uid of userIds) {
    net[uid] = {};
    for (const uid2 of userIds) {
      net[uid][uid2] = 0;
    }
  }

  for (const split of splits) {
    const debtor = split.userId;
    const creditor = split.expense.payerId;
    if (debtor === creditor) continue;
    if (!net[debtor] || !net[creditor]) continue;
    net[debtor][creditor] += split.amount;
  }

  for (const s of confirmedSettlements) {
    if (!net[s.fromUserId] || !net[s.toUserId]) continue;
    net[s.fromUserId][s.toUserId] -= s.amount;
  }

  // Collapse pairwise: if A owes B and B owes A, net it out
  const debts: DebtSummary[] = [];
  const seen = new Set<string>();

  for (const a of userIds) {
    for (const b of userIds) {
      if (a === b) continue;
      const key = [a, b].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);

      const aOwesB = net[a][b] || 0;
      const bOwesA = net[b][a] || 0;
      const netAmount = aOwesB - bOwesA;

      if (netAmount > 0) {
        debts.push({
          fromUserId: a,
          fromUserName: userMap.get(a) || "?",
          toUserId: b,
          toUserName: userMap.get(b) || "?",
          amount: netAmount,
        });
      } else if (netAmount < 0) {
        debts.push({
          fromUserId: b,
          fromUserName: userMap.get(b) || "?",
          toUserId: a,
          toUserName: userMap.get(a) || "?",
          amount: -netAmount,
        });
      }
    }
  }

  return debts.filter((d) => d.amount > 0);
}

export async function getPendingSettlements(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  return db.settlement.findMany({
    where: {
      householdId,
      confirmedAt: null,
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
