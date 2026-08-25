import { config } from 'dotenv';
config();
import { db } from './src/lib/db';
import * as fs from 'fs';

async function main() {
  const users = await db.user.findMany({ 
    where: { email: { contains: 'joako', mode: 'insensitive' } },
    include: { memberships: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => process.exit(0));
