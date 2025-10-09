const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTransactions() {
  console.log('🔍 Verifying SPENT transaction amounts...\n');

  const spentTransactions = await prisma.transaction.findMany({
    where: { type: 'SPENT' },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: { name: true, email: true }
      }
    }
  });

  console.log(`Found ${spentTransactions.length} recent SPENT transactions:\n`);

  spentTransactions.forEach(t => {
    const status = t.amount > 0 ? '✅' : '❌';
    console.log(`${status} ${t.id.substring(0, 10)}... | ${t.customer.name || 'Unknown'}`);
    console.log(`   Points: ${t.points} | Amount: £${t.amount.toFixed(2)} | Date: ${t.createdAt.toLocaleDateString()}\n`);
  });

  const withoutAmount = spentTransactions.filter(t => t.amount <= 0).length;
  const withAmount = spentTransactions.filter(t => t.amount > 0).length;

  console.log('='.repeat(80));
  console.log(`✅ Transactions with face value: ${withAmount}`);
  console.log(`❌ Transactions without face value: ${withoutAmount}`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

verifyTransactions();

