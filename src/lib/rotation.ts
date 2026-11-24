import { TaskFrequency } from "@/generated/prisma/client";
import { chileToday } from "@/lib/dates";

// Todo en UTC: el día calendario UTC de una fecha guardada es el día real (ver lib/dates.ts).

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function uniqSorted(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function addDays(base: Date, n: number): Date {
  const r = new Date(base);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// Día `day` del mes base+monthOffset, ajustado al último día si el mes es más corto (31 → 30/28).
function dayOfMonth(base: Date, monthOffset: number, day: number): Date {
  const r = new Date(base);
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + monthOffset);
  r.setUTCDate(Math.min(day, daysInMonth(r.getUTCFullYear(), r.getUTCMonth())));
  return r;
}

function nextMonthly(from: Date, days: number[], inclusive: boolean): Date {
  for (const offset of [0, 1]) {
    for (const d of days) {
      const candidate = dayOfMonth(from, offset, d);
      if (inclusive ? candidate >= from : candidate > from) return candidate;
    }
  }
  return dayOfMonth(from, 1, days[0]);
}

export function computeInitialDueDate(
  frequency: TaskFrequency,
  daysOfWeek: number[],
  daysOfMonth: number[],
): Date {
  const today = chileToday();

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const days = uniqSorted(daysOfWeek);
    if (days.length === 0) return today;
    const currentDay = today.getUTCDay();
    const sameOrAfter = days.find((d) => d >= currentDay);
    return sameOrAfter !== undefined
      ? addDays(today, sameOrAfter - currentDay)
      : addDays(today, 7 - currentDay + days[0]);
  }

  if (frequency === "MONTHLY") {
    const days = uniqSorted(daysOfMonth);
    if (days.length === 0) return today;
    return nextMonthly(today, days, true);
  }

  return today;
}

export function computeNextDueDate(
  current: Date,
  frequency: TaskFrequency,
  daysOfWeek: number[],
  daysOfMonth: number[],
): Date {
  if (frequency === "DAILY") return addDays(current, 1);

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const gap = frequency === "WEEKLY" ? 0 : 7;
    const days = uniqSorted(daysOfWeek);
    if (days.length === 0) return addDays(current, 7 + gap);
    const currentDay = current.getUTCDay();
    const nextInWeek = days.find((d) => d > currentDay);
    return nextInWeek !== undefined
      ? addDays(current, nextInWeek - currentDay)
      : addDays(current, 7 - currentDay + gap + days[0]);
  }

  if (frequency === "MONTHLY") {
    const days = uniqSorted(daysOfMonth);
    if (days.length === 0) return dayOfMonth(current, 1, current.getUTCDate());
    return nextMonthly(current, days, false);
  }

  return current;
}
