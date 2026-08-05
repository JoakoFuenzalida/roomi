import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const householdNameSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(40, "Máx 40 caracteres"),
});

export const inviteCodeSchema = z.object({
  code: z.string().trim().min(4, "Código inválido"),
});

export const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Título muy corto")
      .max(50, "Máx 50 caracteres"),
    frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"], {
      message: "Selecciona una frecuencia válida",
    }),
    points: z.coerce
      .number()
      .int()
      .min(1, "Mínimo 1")
      .max(100, "Máx 100")
      .default(1),
    daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).default([]),
    daysOfMonth: z.array(z.coerce.number().int().min(1).max(31)).default([]),
  })
  .refine(
    (v) =>
      v.frequency === "DAILY" ||
      v.frequency === "MONTHLY" ||
      v.daysOfWeek.length > 0,
    { message: "Elige al menos un día de la semana", path: ["daysOfWeek"] },
  )
  .refine(
    (v) => v.frequency !== "MONTHLY" || v.daysOfMonth.length > 0,
    { message: "Elige al menos un día del mes", path: ["daysOfMonth"] },
  );

export const shoppingItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Título muy corto")
    .max(60, "Máx 60 caracteres"),
  quantity: z.string().trim().max(30).optional(),
  isRecurring: z.coerce.boolean().default(false),
  frequency: z
    .enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"])
    .optional(),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).default([]),
  daysOfMonth: z.array(z.coerce.number().int().min(1).max(31)).default([]),
});

export const marcarCompradoSchema = z.object({
  amount: z.coerce
    .number()
    .int("Sin decimales")
    .min(1, "Monto debe ser positivo"),
  excludedUserIds: z.array(z.string()).default([]),
});

export const settlementSchema = z.object({
  toUserId: z.string().min(1, "Selecciona a quién le pagaste"),
  amount: z.coerce
    .number()
    .int("Sin decimales")
    .min(1, "Monto debe ser positivo"),
  method: z
    .enum(["Transferencia", "Efectivo", "Otro"])
    .optional(),
  note: z.string().trim().max(100).optional(),
});
