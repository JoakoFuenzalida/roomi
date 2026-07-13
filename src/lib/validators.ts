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
