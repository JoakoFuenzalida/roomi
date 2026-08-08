"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { roomSchema, billItemSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

// ============ ROOMS ============

export async function crearRoom(
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo el admin puede configurar piezas" };
  }

  const parse = roomSchema.safeParse({
    name: formData.get("name"),
    monthlyCost: formData.get("monthlyCost"),
    membershipId: formData.get("membershipId") || undefined,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { name, monthlyCost, membershipId } = parse.data;

  if (membershipId) {
    await assertMemberOf(
      (await db.membership.findUniqueOrThrow({ where: { id: membershipId } }))
        .userId,
      householdId,
    );
  }

  await db.room.create({
    data: {
      householdId,
      name,
      monthlyCost,
      membershipId: membershipId || null,
    },
  });

  revalidatePath("/cuentas");
  return { success: true, ts: Date.now() };
}

export async function editarRoom(
  roomId: string,
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo el admin puede configurar piezas" };
  }

  const parse = roomSchema.safeParse({
    name: formData.get("name"),
    monthlyCost: formData.get("monthlyCost"),
    membershipId: formData.get("membershipId") || undefined,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { name, monthlyCost, membershipId } = parse.data;

  await db.room.update({
    where: { id: roomId, householdId },
    data: {
      name,
      monthlyCost,
      membershipId: membershipId || null,
    },
  });

  revalidatePath("/cuentas");
  return { success: true, ts: Date.now() };
}

export async function eliminarRoom(roomId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede eliminar piezas");
  }

  await db.room.delete({
    where: { id: roomId, householdId },
  });

  revalidatePath("/cuentas");
}

// ============ RECALCULAR COBROS ============

async function recalcularCobros(billId: string, householdId: string) {
  const bill = await db.monthlyBill.findUnique({
    where: { id: billId },
    include: { items: { include: { splits: true } } },
  });

  if (!bill) return;

  const rooms = await db.room.findMany({
    where: { householdId, membershipId: { not: null } },
    include: { membership: { select: { userId: true } } },
  });

  if (rooms.length === 0) return;

  const userRoomMap = new Map(
    rooms.map((r) => [r.membership!.userId, r.monthlyCost]),
  );
  const allUserIds = rooms.map((r) => r.membership!.userId);

  const chargesByUser = new Map<
    string,
    { roomAmount: number; sharedAmount: number }
  >();

  for (const uid of allUserIds) {
    chargesByUser.set(uid, {
      roomAmount: userRoomMap.get(uid) ?? 0,
      sharedAmount: 0,
    });
  }

  for (const item of bill.items) {
    for (const split of item.splits) {
      if (chargesByUser.has(split.userId)) {
        const current = chargesByUser.get(split.userId)!;
        current.sharedAmount += split.amount;
      }
    }
  }

  for (const [userId, amounts] of chargesByUser) {
    const totalAmount = amounts.roomAmount + amounts.sharedAmount;

    await db.monthlyCharge.upsert({
      where: {
        monthlyBillId_userId: { monthlyBillId: billId, userId },
      },
      create: {
        monthlyBillId: billId,
        userId,
        roomAmount: amounts.roomAmount,
        sharedAmount: amounts.sharedAmount,
        totalAmount,
      },
      update: {
        roomAmount: amounts.roomAmount,
        sharedAmount: amounts.sharedAmount,
        totalAmount,
      },
    });
  }
}

// ============ MONTHLY BILLS ============

async function getOrCreateBill(householdId: string, month: number, year: number, userId: string) {
  let bill = await db.monthlyBill.findUnique({
    where: { householdId_month_year: { householdId, month, year } },
  });

  if (!bill) {
    bill = await db.monthlyBill.create({
      data: { householdId, month, year, createdById: userId },
    });
  }

  return bill;
}

export async function agregarBillItem(
  householdId: string,
  month: number,
  year: number,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo el admin puede agregar gastos" };
  }

  const splitMode = formData.get("splitMode") === "CUSTOM" ? "CUSTOM" : "EQUAL";
  const excludedRaw = splitMode === "EQUAL" ? formData.getAll("excludedUserIds").map(String) : [];

  const parse = billItemSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    excludedUserIds: excludedRaw,
    isRecurring: formData.get("isRecurring"),
    dayOfMonth: formData.get("dayOfMonth") || undefined,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { label, amount, excludedUserIds, isRecurring, dayOfMonth } = parse.data;

  const bill = await getOrCreateBill(householdId, month, year, user.id);

  const customSplits: { userId: string; amount: number }[] = [];
  const activeMembers = await db.membership.findMany({
    where: { householdId, leftAt: null },
    select: { userId: true },
  });

  if (splitMode === "CUSTOM") {
    for (const mem of activeMembers) {
      const val = formData.get(`customSplit_${mem.userId}`);
      if (val) {
        const amt = parseInt(val.toString(), 10);
        if (!isNaN(amt) && amt > 0) {
          customSplits.push({ userId: mem.userId, amount: amt });
        }
      }
    }
  } else {
    // EQUAL mode: create equal splits
    const participants = activeMembers.filter((m) => !excludedUserIds.includes(m.userId));
    if (participants.length > 0) {
      const perPerson = Math.floor(amount / participants.length);
      const remainder = amount - perPerson * participants.length;

      participants.forEach((m, i) => {
        customSplits.push({
          userId: m.userId,
          amount: perPerson + (i < remainder ? 1 : 0),
        });
      });
    }
  }

  await db.billItem.create({
    data: {
      monthlyBillId: bill.id,
      label,
      amount,
      splitMode,
      excludedUserIds,
      isRecurring,
      dayOfMonth: isRecurring ? dayOfMonth : null,
      splits: {
        create: customSplits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
  });

  await recalcularCobros(bill.id, householdId);

  revalidatePath("/cuentas");

  const rooms = await db.room.findMany({
    where: { householdId, membershipId: { not: null } },
    include: { membership: { select: { userId: true } } },
  });

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  for (const room of rooms) {
    if (excludedUserIds.includes(room.membership!.userId)) continue;
    if (room.membership!.userId === user.id) continue;

    const charge = await db.monthlyCharge.findUnique({
      where: {
        monthlyBillId_userId: {
          monthlyBillId: bill.id,
          userId: room.membership!.userId,
        },
      },
    });

    sendPushToUser(room.membership!.userId, {
      title: `Nuevo gasto: ${label} 📋`,
      body: `Tu total de ${monthNames[month - 1]}: $${charge?.totalAmount.toLocaleString("es-CL") ?? amount.toLocaleString("es-CL")}`,
      url: "/cuentas",
    }).catch(() => {});
  }

  return { success: true, ts: Date.now() };
}

export async function editarBillItem(
  itemId: string,
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo el admin puede editar gastos" };
  }

  const item = await db.billItem.findUnique({
    where: { id: itemId },
    include: { monthlyBill: { select: { id: true, householdId: true } } },
  });

  if (!item || item.monthlyBill.householdId !== householdId) {
    return { error: "Item no encontrado" };
  }

  const splitMode = formData.get("splitMode") === "CUSTOM" ? "CUSTOM" : "EQUAL";
  const excludedRaw = splitMode === "EQUAL" ? formData.getAll("excludedUserIds").map(String) : [];

  const parse = billItemSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    excludedUserIds: excludedRaw,
    isRecurring: formData.get("isRecurring"),
    dayOfMonth: formData.get("dayOfMonth") || undefined,
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  const { label, amount, excludedUserIds, isRecurring, dayOfMonth } = parse.data;

  const customSplits: { userId: string; amount: number }[] = [];
  const activeMembers = await db.membership.findMany({
    where: { householdId, leftAt: null },
    select: { userId: true },
  });

  if (splitMode === "CUSTOM") {
    for (const mem of activeMembers) {
      const val = formData.get(`customSplit_${mem.userId}`);
      if (val) {
        const amt = parseInt(val.toString(), 10);
        if (!isNaN(amt) && amt > 0) {
          customSplits.push({ userId: mem.userId, amount: amt });
        }
      }
    }
  } else {
    // EQUAL mode: create equal splits
    const participants = activeMembers.filter((m) => !excludedUserIds.includes(m.userId));
    if (participants.length > 0) {
      const perPerson = Math.floor(amount / participants.length);
      const remainder = amount - perPerson * participants.length;

      participants.forEach((m, i) => {
        customSplits.push({
          userId: m.userId,
          amount: perPerson + (i < remainder ? 1 : 0),
        });
      });
    }
  }

  // Delete existing splits
  await db.billItemSplit.deleteMany({
    where: { billItemId: itemId }
  });

  await db.billItem.update({
    where: { id: itemId },
    data: {
      label,
      amount,
      splitMode,
      excludedUserIds,
      isRecurring,
      dayOfMonth: isRecurring ? dayOfMonth : null,
      splits: {
        create: customSplits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
  });

  await recalcularCobros(item.monthlyBill.id, householdId);
  revalidatePath("/cuentas");

  return { success: true, ts: Date.now() };
}

export async function eliminarBillItem(itemId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede eliminar gastos");
  }

  const item = await db.billItem.findUnique({
    where: { id: itemId },
    include: { monthlyBill: { select: { id: true, householdId: true } } },
  });

  if (!item || item.monthlyBill.householdId !== householdId) {
    throw new Error("Item no encontrado");
  }

  await db.billItem.delete({ where: { id: itemId } });
  await recalcularCobros(item.monthlyBill.id, householdId);

  revalidatePath("/cuentas");
}

// ============ PAYMENTS ============

export async function marcarPagadoRoom(chargeId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const charge = await db.monthlyCharge.findUnique({
    where: { id: chargeId },
    include: {
      monthlyBill: { select: { householdId: true, createdById: true, month: true } },
    },
  });

  if (!charge || charge.monthlyBill.householdId !== householdId) {
    throw new Error("Cargo no encontrado");
  }

  if (charge.userId !== user.id) {
    throw new Error("Solo puedes marcar tu propio pago");
  }

  if (charge.roomPaidAt) {
    return { error: "Ya marcaste este pago" };
  }

  await db.monthlyCharge.update({
    where: { id: chargeId },
    data: { roomPaidAt: new Date() },
  });

  revalidatePath("/cuentas");

  sendPushToUser(charge.monthlyBill.createdById, {
    title: "Pago de arriendo registrado 💸",
    body: `${user.name} marcó como pagado $${charge.roomAmount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

export async function confirmarPagoRoom(chargeId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede confirmar pagos");
  }

  const charge = await db.monthlyCharge.findUnique({
    where: { id: chargeId },
    include: { monthlyBill: { select: { householdId: true } } },
  });

  if (!charge || charge.monthlyBill.householdId !== householdId) {
    throw new Error("Cargo no encontrado");
  }

  if (!charge.roomPaidAt) {
    return { error: "El miembro aún no marca como pagado" };
  }

  if (charge.roomConfirmedAt) {
    return { error: "Este pago ya fue confirmado" };
  }

  await db.monthlyCharge.update({
    where: { id: chargeId },
    data: { roomConfirmedAt: new Date(), roomConfirmedById: user.id },
  });

  revalidatePath("/cuentas");

  sendPushToUser(charge.userId, {
    title: "Pago de arriendo confirmado ✅",
    body: `${user.name} confirmó tu pago de $${charge.roomAmount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

export async function marcarPagadoBillItem(splitId: string, householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  const split = await db.billItemSplit.findUnique({
    where: { id: splitId },
    include: {
      billItem: { include: { monthlyBill: { select: { householdId: true, createdById: true } } } },
    },
  });

  if (!split || split.billItem.monthlyBill.householdId !== householdId) {
    throw new Error("Cargo no encontrado");
  }

  if (split.userId !== user.id) {
    throw new Error("Solo puedes marcar tu propio pago");
  }

  if (split.paidAt) {
    return { error: "Ya marcaste este pago" };
  }

  await db.billItemSplit.update({
    where: { id: splitId },
    data: { paidAt: new Date() },
  });

  revalidatePath("/cuentas");

  sendPushToUser(split.billItem.monthlyBill.createdById, {
    title: `Pago de ${split.billItem.label} registrado 💸`,
    body: `${user.name} marcó como pagado $${split.amount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

export async function confirmarPagoBillItem(splitId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede confirmar pagos");
  }

  const split = await db.billItemSplit.findUnique({
    where: { id: splitId },
    include: {
      billItem: { include: { monthlyBill: { select: { householdId: true } } } },
    },
  });

  if (!split || split.billItem.monthlyBill.householdId !== householdId) {
    throw new Error("Cargo no encontrado");
  }

  if (!split.paidAt) {
    return { error: "El miembro aún no marca como pagado" };
  }

  if (split.confirmedAt) {
    return { error: "Este pago ya fue confirmado" };
  }

  await db.billItemSplit.update({
    where: { id: splitId },
    data: { confirmedAt: new Date(), confirmedById: user.id },
  });

  revalidatePath("/cuentas");

  sendPushToUser(split.userId, {
    title: `Pago de ${split.billItem.label} confirmado ✅`,
    body: `${user.name} confirmó tu pago de $${split.amount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

// ============ RECURRING ITEMS (CRON) ============

export async function poblarRecurrentes(householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin");
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const prevBill = await db.monthlyBill.findUnique({
    where: {
      householdId_month_year: { householdId, month: prevMonth, year: prevYear },
    },
    include: {
      items: { 
        where: { isRecurring: true },
        include: { splits: true }
      },
    },
  });

  if (!prevBill || prevBill.items.length === 0) {
    return { error: "No hay items recurrentes del mes anterior" };
  }

  const bill = await getOrCreateBill(householdId, month, year, user.id);

  const existingLabels = await db.billItem.findMany({
    where: { monthlyBillId: bill.id },
    select: { label: true },
  });
  const existingSet = new Set(existingLabels.map((i) => i.label));

  let added = 0;
  for (const item of prevBill.items) {
    if (existingSet.has(item.label)) continue;

    await db.billItem.create({
      data: {
        monthlyBillId: bill.id,
        label: item.label,
        amount: item.amount,
        splitMode: item.splitMode,
        excludedUserIds: item.excludedUserIds,
        isRecurring: true,
        dayOfMonth: item.dayOfMonth,
        splits: item.splits.length > 0
          ? {
              create: item.splits.map(s => ({
                userId: s.userId,
                amount: s.amount
              }))
            }
          : undefined,
      },
    });
    added++;
  }

  if (added > 0) {
    await recalcularCobros(bill.id, householdId);
  }

  revalidatePath("/cuentas");
  return { success: true, added };
}

// ============ QUERIES ============

export async function getRooms(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  return db.room.findMany({
    where: { householdId },
    include: {
      membership: {
        select: { id: true, user: { select: { id: true, name: true, image: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getMonthlyBill(householdId: string, month: number, year: number) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  return db.monthlyBill.findUnique({
    where: { householdId_month_year: { householdId, month, year } },
    include: {
      items: { 
        orderBy: { createdAt: "asc" },
        include: { splits: true }
      },
      charges: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          roomConfirmedBy: { select: { name: true, image: true } },
        },
        orderBy: { totalAmount: "desc" },
      },
    },
  });
}
