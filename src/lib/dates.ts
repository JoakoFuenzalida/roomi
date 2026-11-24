const DAY_MS = 86_400_000;

// Las fechas de vencimiento se guardan entre 00:00 y 05:00 UTC, así que su día calendario
// UTC es el día real. "Hoy" en cambio depende de Chile: el server corre en UTC y desde
// las ~21:00 en Chile ya sería mañana.
export function chileToday(): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function daysUntil(due: Date, today: Date = chileToday()): number {
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((dueDay - today.getTime()) / DAY_MS);
}

export type DueTone = "overdue" | "today" | "soon" | "later";

const shortDate = new Intl.DateTimeFormat("es-CL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function dueInfo(due: Date, today?: Date): { days: number; tone: DueTone; label: string } {
  const days = daysUntil(due, today);
  if (days < 0) {
    const n = -days;
    return { days, tone: "overdue", label: `Atrasada · ${n} día${n === 1 ? "" : "s"}` };
  }
  if (days === 0) return { days, tone: "today", label: "Hoy" };
  if (days === 1) return { days, tone: "soon", label: "Mañana" };
  return { days, tone: days <= 6 ? "soon" : "later", label: shortDate.format(due).replace(/[.,]/g, "") };
}
