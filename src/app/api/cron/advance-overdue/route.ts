import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeNextDueDate } from "@/lib/rotation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdue = await db.task.findMany({
    where: {
      active: true,
      nextDueDate: { lt: startOfToday },
      nextAssigneeMembershipId: { not: null },
    },
    select: {
      id: true,
      householdId: true,
      cycleNumber: true,
      nextAssigneeMembershipId: true,
      nextDueDate: true,
      frequency: true,
      daysOfWeek: true,
      daysOfMonth: true,
    },
  });

  const advanced: string[] = [];
  const skipped: { taskId: string; reason: string }[] = [];

  for (const task of overdue) {
    try {
      await db.$transaction(async (tx) => {
        const assignedMembership = await tx.membership.findUnique({
          where: { id: task.nextAssigneeMembershipId! },
          select: { userId: true },
        });
        if (!assignedMembership) {
          skipped.push({ taskId: task.id, reason: "assignee membership missing" });
          return;
        }

        await tx.taskExecution.create({
          data: {
            taskId: task.id,
            cycleNumber: task.cycleNumber,
            completedById: assignedMembership.userId,
            wasAssigned: true,
            pointsEarned: 0,
          },
        });

        const activeMembers = await tx.membership.findMany({
          where: {
            householdId: task.householdId,
            leftAt: null,
            OR: [
              { onVacationUntil: null },
              { onVacationUntil: { lt: new Date() } },
            ],
          },
          orderBy: { rotationOrder: "asc" },
        });

        let nextAssigneeId = task.nextAssigneeMembershipId;
        if (activeMembers.length > 0) {
          const currentIndex = activeMembers.findIndex(
            (m) => m.id === task.nextAssigneeMembershipId,
          );
          const nextIndex =
            currentIndex === -1 ? 0 : (currentIndex + 1) % activeMembers.length;
          nextAssigneeId = activeMembers[nextIndex].id;
        }

        await tx.task.update({
          where: { id: task.id },
          data: {
            nextAssigneeMembershipId: nextAssigneeId,
            nextDueDate: computeNextDueDate(
              task.nextDueDate,
              task.frequency,
              task.daysOfWeek,
              task.daysOfMonth,
            ),
            cycleNumber: { increment: 1 },
          },
        });

        advanced.push(task.id);
      });
    } catch (err) {
      skipped.push({
        taskId: task.id,
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ran: new Date().toISOString(),
    scanned: overdue.length,
    advanced: advanced.length,
    skipped: skipped.length,
    advancedIds: advanced,
    skippedIds: skipped,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
