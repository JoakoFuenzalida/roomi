import { db } from "./src/lib/db";

async function test() {
  console.log("Checking DB tasks and taskExecutions");
  const households = await db.household.findMany({
    include: { tasks: { include: { executions: true } } }
  });
  
  for (const h of households) {
    console.log(`Household: ${h.name} (${h.id})`);
    let totalPoints = 0;
    for (const t of h.tasks) {
      for (const e of t.executions) {
        totalPoints += e.pointsEarned;
      }
    }
    console.log(`  Total points: ${totalPoints}`);
  }
}

test().catch(console.error).finally(() => process.exit(0));
