import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { chileToday, daysUntil } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PER_USER = 3;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = chileToday();
  const dueTasks = await db.task.findMany({
    where: {
      active: true,
      nextDueDate: { lt: new Date(today.getTime() + 86_400_000) },
      nextAssigneeMembershipId: { not: null },
    },
    include: { nextAssignee: { select: { userId: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  const byUser = new Map<string, typeof dueTasks>();
  for (const task of dueTasks) {
    if (!task.nextAssignee) continue;
    const uid = task.nextAssignee.userId;
    byUser.set(uid, [...(byUser.get(uid) ?? []), task]);
  }

  let sent = 0;
  for (const [userId, tasks] of byUser) {
    for (const task of tasks.slice(0, MAX_PER_USER)) {
      const overdue = daysUntil(task.nextDueDate, today) < 0;
      await sendPushToUser(userId, {
        title: overdue ? "Tarea atrasada ⏰" : "Hoy te toca 🧹",
        body: task.title,
        url: "/hoy",
        tag: `task-${task.id}`,
        task: { id: task.id, cycle: task.cycleNumber, title: task.title },
      }).catch(() => {});
    }
    if (tasks.length > MAX_PER_USER) {
      await sendPushToUser(userId, {
        title: "Tienes más tareas pendientes",
        body: `Y ${tasks.length - MAX_PER_USER} más. Revísalas en Roomi.`,
        url: "/hoy",
        tag: "tasks-more",
      }).catch(() => {});
    }
    sent++;
  }

  return NextResponse.json({
    ran: new Date().toISOString(),
    tasksFound: dueTasks.length,
    usersNotified: sent,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
