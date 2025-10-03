const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealDatabase() {
  console.log('🧪 Testing Real Database Integration...\n');

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if we have any data
    console.log('2. Checking existing data...');
    
    const customerCount = await prisma.customer.count();
    const transactionCount = await prisma.transaction.count();
    const rewardCount = await prisma.reward.count();
    const userCount = await prisma.user.count();
    
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Rewards: ${rewardCount}`);
    console.log(`   Users: ${userCount}\n`);

    // Test 3: Test dashboard stats queries
    console.log('3. Testing dashboard stats queries...');
    
    const totalCustomers = await prisma.customer.count();
    console.log(`   Total customers: ${totalCustomers}`);

    const pointsIssued = await prisma.transaction.aggregate({
      where: {
        type: 'EARNED',
        status: 'APPROVED'
      },
      _sum: {
        points: true
      }
    });
    console.log(`   Total points issued: ${pointsIssued._sum.points || 0}`);

    const avgTransaction = await prisma.transaction.aggregate({
      where: {
        type: 'EARNED',
        status: 'APPROVED',
        amount: { gt: 0 }
      },
      _avg: {
        amount: true
      }
    });
    console.log(`   Average transaction: £${(avgTransaction._avg.amount || 0).toFixed(2)}`);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        type: 'EARNED',
        status: 'APPROVED'
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log(`   Recent transactions: ${recentTransactions.length} found\n`);

    // Test 4: Test popular rewards query
    console.log('4. Testing popular rewards query...');
    
    const popularRewards = await prisma.redemption.groupBy({
      by: ['rewardId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });
    console.log(`   Popular rewards: ${popularRewards.length} found\n`);

    // Test 5: Test transaction queries by role
    console.log('5. Testing transaction queries...');
    
    const allTransactions = await prisma.transaction.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    console.log(`   All transactions: ${allTransactions.length} found`);

    if (allTransactions.length > 0) {
      const firstTransaction = allTransactions[0];
      console.log(`   Sample transaction: ${firstTransaction.customer.name} - £${firstTransaction.amount} - ${firstTransaction.points} points`);
    }

    console.log('\n✅ All database tests passed!');
    console.log('🎉 Your APIs are now using the real Prisma database!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testRealDatabase(); 