import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
});

const CRON_SECRET = process.env.CRON_SECRET!;

async function main() {
  const household = await db.household.findFirst({
    where: { name: "Depa Vitacura" },
    include: {
      members: {
        where: { leftAt: null },
        orderBy: { rotationOrder: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!household) throw new Error("No household found. Create one first.");
  if (household.members.length < 2) throw new Error("Need at least 2 members.");

  console.log("Household:", household.name);
  console.log(
    "Members in rotation order:",
    household.members.map((m) => `${m.rotationOrder}. ${m.user.name}`),
  );

  const firstMembership = household.members[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);

  await db.task.deleteMany({
    where: { householdId: household.id, title: "TEST CRON — borrar" },
  });

  const created = await db.task.create({
    data: {
      householdId: household.id,
      title: "TEST CRON — borrar",
      frequency: "DAILY",
      points: 3,
      active: true,
      nextAssigneeMembershipId: firstMembership.id,
      nextDueDate: yesterday,
      cycleNumber: 0,
    },
  });

  console.log("\n--- BEFORE cron ---");
  console.log("Task ID:", created.id);
  console.log("Assignee:", firstMembership.user.name);
  console.log("Due date:", created.nextDueDate.toISOString());
  console.log("Cycle:", created.cycleNumber);
  console.log(
    "Executions:",
    await db.taskExecution.count({ where: { taskId: created.id } }),
  );

  console.log("\n--- Calling cron endpoint... ---");
  const res = await fetch("http://localhost:3000/api/cron/advance-overdue", {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const body = await res.json();
  console.log("HTTP:", res.status);
  console.log("Response:", JSON.stringify(body, null, 2));

  const after = await db.task.findUnique({
    where: { id: created.id },
    include: {
      nextAssignee: { include: { user: { select: { name: true } } } },
      executions: {
        include: { completedBy: { select: { name: true } } },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  console.log("\n--- AFTER cron ---");
  console.log("Assignee:", after?.nextAssignee?.user.name);
  console.log("Due date:", after?.nextDueDate.toISOString());
  console.log("Cycle:", after?.cycleNumber);
  console.log("Executions:");
  for (const e of after?.executions ?? []) {
    console.log(
      `  - ${e.completedBy.name} · cycle ${e.cycleNumber} · ${e.pointsEarned} pts · wasAssigned=${e.wasAssigned}`,
    );
  }

  await db.taskExecution.deleteMany({ where: { taskId: created.id } });
  await db.task.delete({ where: { id: created.id } });
  console.log("\n✓ Test task limpiado");

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
