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

// ============ MONTHLY BILLS ============

export async function crearBoleta(householdId: string, month: number, year: number) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede crear boletas");
  }

  const existing = await db.monthlyBill.findUnique({
    where: { householdId_month_year: { householdId, month, year } },
  });

  if (existing) {
    return { error: "Ya existe una boleta para este mes" };
  }

  const bill = await db.monthlyBill.create({
    data: {
      householdId,
      month,
      year,
      createdById: user.id,
    },
  });

  revalidatePath("/cuentas");
  return { success: true, billId: bill.id };
}

export async function agregarBillItem(
  billId: string,
  householdId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    return { error: "Solo el admin puede agregar items" };
  }

  const bill = await db.monthlyBill.findUnique({
    where: { id: billId, householdId, status: "DRAFT" },
  });

  if (!bill) {
    return { error: "Boleta no encontrada o ya publicada" };
  }

  const parse = billItemSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
  });

  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }

  await db.billItem.create({
    data: {
      monthlyBillId: billId,
      label: parse.data.label,
      amount: parse.data.amount,
    },
  });

  revalidatePath("/cuentas");
  return { success: true, ts: Date.now() };
}

export async function eliminarBillItem(itemId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede eliminar items");
  }

  const item = await db.billItem.findUnique({
    where: { id: itemId },
    include: { monthlyBill: { select: { householdId: true, status: true } } },
  });

  if (!item || item.monthlyBill.householdId !== householdId) {
    throw new Error("Item no encontrado");
  }

  if (item.monthlyBill.status !== "DRAFT") {
    throw new Error("No se puede editar una boleta publicada");
  }

  await db.billItem.delete({ where: { id: itemId } });

  revalidatePath("/cuentas");
}

export async function publicarBoleta(billId: string, householdId: string) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede publicar boletas");
  }

  const bill = await db.monthlyBill.findUnique({
    where: { id: billId, householdId, status: "DRAFT" },
    include: { items: true },
  });

  if (!bill) {
    throw new Error("Boleta no encontrada o ya publicada");
  }

  if (bill.items.length === 0) {
    return { error: "Agrega al menos un gasto antes de publicar" };
  }

  const rooms = await db.room.findMany({
    where: { householdId, membershipId: { not: null } },
    include: { membership: { select: { userId: true } } },
  });

  if (rooms.length === 0) {
    return { error: "Configura las piezas antes de publicar" };
  }

  const sharedTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
  const sharedPerPerson = Math.floor(sharedTotal / rooms.length);
  const sharedRemainder = sharedTotal - sharedPerPerson * rooms.length;

  const charges = rooms.map((room, i) => ({
    monthlyBillId: billId,
    userId: room.membership!.userId,
    roomAmount: room.monthlyCost,
    sharedAmount: sharedPerPerson + (i < sharedRemainder ? 1 : 0),
    totalAmount:
      room.monthlyCost + sharedPerPerson + (i < sharedRemainder ? 1 : 0),
  }));

  await db.$transaction(async (tx) => {
    await tx.monthlyBill.update({
      where: { id: billId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    await tx.monthlyCharge.createMany({ data: charges });
  });

  revalidatePath("/cuentas");

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  for (const charge of charges) {
    sendPushToUser(charge.userId, {
      title: `Cuentas de ${monthNames[bill.month - 1]} 📋`,
      body: `Te toca pagar $${charge.totalAmount.toLocaleString("es-CL")}`,
      url: "/cuentas",
    }).catch(() => {});
  }

  return { success: true };
}

// ============ PAYMENTS ============

export async function marcarPagadoCuenta(chargeId: string, householdId: string) {
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

  if (charge.paidAt) {
    return { error: "Ya marcaste este pago" };
  }

  await db.monthlyCharge.update({
    where: { id: chargeId },
    data: { paidAt: new Date() },
  });

  revalidatePath("/cuentas");

  sendPushToUser(charge.monthlyBill.createdById, {
    title: "Pago registrado 💸",
    body: `${user.name} marcó como pagado $${charge.totalAmount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

export async function confirmarPagoCuenta(chargeId: string, householdId: string) {
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

  if (!charge.paidAt) {
    return { error: "El miembro aún no marca como pagado" };
  }

  if (charge.confirmedAt) {
    return { error: "Este pago ya fue confirmado" };
  }

  await db.monthlyCharge.update({
    where: { id: chargeId },
    data: { confirmedAt: new Date(), confirmedById: user.id },
  });

  revalidatePath("/cuentas");

  sendPushToUser(charge.userId, {
    title: "Pago confirmado ✅",
    body: `${user.name} confirmó tu pago de $${charge.totalAmount.toLocaleString("es-CL")}`,
    url: "/cuentas",
  }).catch(() => {});

  return { success: true };
}

// ============ QUERIES ============

export async function getRooms(householdId: string) {
  const user = await requireUser();
  await assertMemberOf(user.id, householdId);

  return db.room.findMany({
    where: { householdId },
    include: {
      membership: {
        select: { id: true, user: { select: { id: true, name: true } } },
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
      items: { orderBy: { label: "asc" } },
      charges: {
        include: {
          user: { select: { id: true, name: true } },
          confirmedBy: { select: { name: true } },
        },
        orderBy: { totalAmount: "desc" },
      },
    },
  });
}
