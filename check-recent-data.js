const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentData() {
  try {
    console.log('🔍 Checking recent data status...\n');
    
    // Check recent users (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`👥 Recent Users (last 3 months): ${recentUsers.length}`);
    recentUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check recent customers
    const recentCustomers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n👤 Recent Customers (last 3 months): ${recentCustomers.length}`);
    recentCustomers.forEach(customer => {
      console.log(`  - ${customer.email} - ${customer.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        customer: {
          select: {
            email: true
          }
        },
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n💰 Recent Transactions (last 3 months): ${recentTransactions.length}`);
    if (recentTransactions.length > 0) {
      const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const avgAmount = totalAmount / recentTransactions.length;
      console.log(`  - Total amount: £${totalAmount.toFixed(2)}`);
      console.log(`  - Average amount: £${avgAmount.toFixed(2)}`);
      
      recentTransactions.slice(0, 5).forEach(transaction => {
        console.log(`  - £${transaction.amount} - ${transaction.customer.email} → ${transaction.user.email} - ${transaction.createdAt.toISOString().split('T')[0]}`);
      });
      
      if (recentTransactions.length > 5) {
        console.log(`  ... and ${recentTransactions.length - 5} more transactions`);
      }
    }
    
    // Check recent tenants/partners
    const recentTenants = await prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n🏢 Recent Tenants/Partners (last 3 months): ${recentTenants.length}`);
    recentTenants.forEach(tenant => {
      console.log(`  - ${tenant.name} - ${tenant.createdAt.toISOString().split('T')[0]}`);
    });
    
    console.log('\n✅ Recent data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking recent data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentData();

