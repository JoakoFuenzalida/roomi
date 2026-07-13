import { TaskFrequency } from "@/generated/prisma/client";

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function uniqSorted(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

export function computeInitialDueDate(
  frequency: TaskFrequency,
  daysOfWeek: number[],
  daysOfMonth: number[],
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "DAILY") return today;

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const days = uniqSorted(daysOfWeek);
    if (days.length === 0) return today;
    const currentDay = today.getDay();
    const sameOrAfter = days.find((d) => d >= currentDay);
    const result = new Date(today);
    if (sameOrAfter !== undefined) {
      result.setDate(today.getDate() + (sameOrAfter - currentDay));
    } else {
      // Next week's first scheduled day
      result.setDate(today.getDate() + (7 - currentDay) + days[0]);
    }
    return result;
  }

  if (frequency === "MONTHLY") {
    const days = uniqSorted(daysOfMonth);
    if (days.length === 0) return today;
    const currentDate = today.getDate();
    const result = new Date(today);
    const sameOrAfter = days.find((d) => d >= currentDate);
    if (sameOrAfter !== undefined) {
      const lastDay = daysInMonth(result.getFullYear(), result.getMonth());
      result.setDate(Math.min(sameOrAfter, lastDay));
    } else {
      result.setMonth(result.getMonth() + 1);
      const lastDay = daysInMonth(result.getFullYear(), result.getMonth());
      result.setDate(Math.min(days[0], lastDay));
    }
    return result;
  }

  return today;
}

export function computeNextDueDate(
  current: Date,
  frequency: TaskFrequency,
  daysOfWeek: number[],
  daysOfMonth: number[],
): Date {
  if (frequency === "DAILY") {
    const r = new Date(current);
    r.setDate(r.getDate() + 1);
    return r;
  }

  if (frequency === "WEEKLY") {
    const days = uniqSorted(daysOfWeek);
    if (days.length === 0) {
      const r = new Date(current);
      r.setDate(r.getDate() + 7);
      return r;
    }
    const currentDay = current.getDay();
    const nextInWeek = days.find((d) => d > currentDay);
    const r = new Date(current);
    if (nextInWeek !== undefined) {
      r.setDate(current.getDate() + (nextInWeek - currentDay));
    } else {
      // Jump to next week's first scheduled day
      r.setDate(current.getDate() + (7 - currentDay) + days[0]);
    }
    return r;
  }

  if (frequency === "BIWEEKLY") {
    const days = uniqSorted(daysOfWeek);
    if (days.length === 0) {
      const r = new Date(current);
      r.setDate(r.getDate() + 14);
      return r;
    }
    const currentDay = current.getDay();
    const nextInWeek = days.find((d) => d > currentDay);
    const r = new Date(current);
    if (nextInWeek !== undefined) {
      r.setDate(current.getDate() + (nextInWeek - currentDay));
    } else {
      // Skip a full week + jump to first scheduled day of the week after
      r.setDate(current.getDate() + (7 - currentDay) + 7 + days[0]);
    }
    return r;
  }

  if (frequency === "MONTHLY") {
    const days = uniqSorted(daysOfMonth);
    if (days.length === 0) {
      const r = new Date(current);
      r.setMonth(r.getMonth() + 1);
      return r;
    }
    const currentDate = current.getDate();
    const nextInMonth = days.find((d) => d > currentDate);
    const r = new Date(current);
    if (nextInMonth !== undefined) {
      const lastDay = daysInMonth(r.getFullYear(), r.getMonth());
      r.setDate(Math.min(nextInMonth, lastDay));
    } else {
      r.setMonth(r.getMonth() + 1);
      const lastDay = daysInMonth(r.getFullYear(), r.getMonth());
      r.setDate(Math.min(days[0], lastDay));
    }
    return r;
  }

  return current;
}
