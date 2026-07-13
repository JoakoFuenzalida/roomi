import { TaskFrequency } from "@/generated/prisma/client";

export function addInterval(date: Date, frequency: TaskFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export function computeInitialDueDate(
  frequency: TaskFrequency,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "DAILY") return today;

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    if (dayOfWeek == null) return today;
    const diff = (dayOfWeek - today.getDay() + 7) % 7;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
  }

  if (frequency === "MONTHLY") {
    if (dayOfMonth == null) return today;
    const result = new Date(today);
    if (dayOfMonth >= today.getDate()) {
      const lastDayThisMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0,
      ).getDate();
      result.setDate(Math.min(dayOfMonth, lastDayThisMonth));
    } else {
      result.setMonth(result.getMonth() + 1);
      const lastDayNextMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0,
      ).getDate();
      result.setDate(Math.min(dayOfMonth, lastDayNextMonth));
    }
    return result;
  }

  return today;
}
