import { config } from 'dotenv';
config();
import { db } from './src/lib/db';
import * as fs from 'fs';

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true } });
  const memberships = await db.membership.findMany({ select: { id: true, userId: true, householdId: true } });
  fs.writeFileSync('db_out.json', JSON.stringify({ users, memberships }, null, 2));
}

main().finally(() => process.exit(0));
