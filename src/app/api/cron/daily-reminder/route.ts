import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const dueTasks = await db.task.findMany({
    where: {
      active: true,
      nextDueDate: { lte: endOfToday },
      nextAssigneeMembershipId: { not: null },
    },
    include: {
      nextAssignee: {
        select: { userId: true, user: { select: { name: true } } },
      },
    },
  });

  const byUser = new Map<string, string[]>();
  for (const task of dueTasks) {
    if (!task.nextAssignee) continue;
    const uid = task.nextAssignee.userId;
    const list = byUser.get(uid) ?? [];
    list.push(task.title);
    byUser.set(uid, list);
  }

  let sent = 0;
  for (const [userId, titles] of byUser) {
    const body =
      titles.length === 1
        ? titles[0]
        : `${titles[0]} y ${titles.length - 1} más`;

    await sendPushToUser(userId, {
      title: `Hoy te toca 🧹`,
      body,
      url: "/tareas",
    }).catch(() => {});

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
