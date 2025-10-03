const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const customer = await prisma.customer.findUnique({
      where: { email: 'alice.customer@localperks.com' },
      select: { email: true, points: true }
    });
    if (!customer) {
      console.log(JSON.stringify({ found: false }));
    } else {
      console.log(JSON.stringify({ found: true, email: customer.email, points: customer.points }));
    }
  } catch (err) {
    console.error('Query failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



