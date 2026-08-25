const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Users:', await prisma.user.findMany());
  console.log('Households:', await prisma.household.findMany());
  console.log('Memberships:', await prisma.membership.findMany());
}

main().finally(() => prisma.$disconnect());
