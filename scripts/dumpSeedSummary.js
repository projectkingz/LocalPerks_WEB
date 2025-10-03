const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const customers = await prisma.customer.findMany({
      select: { id: true, email: true, name: true, points: true, tenantId: true },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, email: true, name: true } },
      },
      take: 20,
    });

    const summary = {
      customers,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        points: t.points,
        createdAt: t.createdAt,
        customer: t.customer ? { id: t.customer.id, email: t.customer.email, name: t.customer.name } : null,
      })),
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (err) {
    console.error('Dump failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();




