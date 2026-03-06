const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactionSeeding() {
  try {
    console.log('🔍 Checking Transaction Seeding Status...');
    console.log('==========================================\n');
    
    // Get overall counts
    const counts = {
      users: await prisma.user.count(),
      tenants: await prisma.tenant.count(),
      rewards: await prisma.reward.count(),
      customers: await prisma.customer.count(),
      transactions: await prisma.transaction.count(),
      vouchers: await prisma.voucher.count(),
      redemptions: await prisma.redemption.count()
    };
    
    console.log('📊 Database Overview:');
    console.log(`👥 Users: ${counts.users}`);
    console.log(`🏢 Tenants: ${counts.tenants}`);
    console.log(`🎁 Rewards: ${counts.rewards}`);
    console.log(`👤 Customers: ${counts.customers}`);
    console.log(`💰 Transactions: ${counts.transactions}`);
    console.log(`🎫 Vouchers: ${counts.vouchers}`);
    console.log(`🔄 Redemptions: ${counts.redemptions}`);
    
    // Check transaction details
    console.log('\n💰 Transaction Analysis:');
    console.log('========================');
    
    const transactionTypes = await prisma.transaction.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    
    console.log('\n📈 Transaction Types:');
    transactionTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type} transactions`);
    });
    
    const transactionStatuses = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('\n📊 Transaction Statuses:');
    transactionStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status} transactions`);
    });
    
    // Check recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n🕒 Recent Transactions (Last 5):');
    recentTransactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.customer?.name || 'Unknown'} - £${tx.amount.toFixed(2)} (${tx.points} pts) - ${tx.tenant?.name || 'Unknown'} - ${tx.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check transaction totals
    const totalAmount = await prisma.transaction.aggregate({
      _sum: { amount: true }
    });
    
    const totalPoints = await prisma.transaction.aggregate({
      _sum: { points: true }
    });
    
    console.log('\n💎 Transaction Totals:');
    console.log(`  Total Amount: £${totalAmount._sum.amount?.toFixed(2) || '0.00'}`);
    console.log(`  Total Points: ${totalPoints._sum.points?.toLocaleString() || '0'}`);
    
    // Check vouchers
    const voucherStatuses = await prisma.voucher.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('\n🎫 Voucher Statuses:');
    voucherStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status} vouchers`);
    });
    
    // Check customer points
    const customerStats = await prisma.customer.aggregate({
      _avg: { points: true },
      _max: { points: true },
      _min: { points: true },
      _sum: { points: true }
    });
    
    console.log('\n👤 Customer Points Statistics:');
    console.log(`  Average Points: ${Math.round(customerStats._avg.points || 0)}`);
    console.log(`  Maximum Points: ${customerStats._max.points || 0}`);
    console.log(`  Minimum Points: ${customerStats._min.points || 0}`);
    console.log(`  Total Points: ${customerStats._sum.points?.toLocaleString() || '0'}`);
    
    // Check if we have data across different tenants
    const tenantTransactionCounts = await prisma.transaction.groupBy({
      by: ['tenantId'],
      _count: { tenantId: true }
    });
    
    // Get tenant names separately
    const tenantIds = tenantTransactionCounts.map(t => t.tenantId);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true }
    });
    
    const tenantMap = {};
    tenants.forEach(tenant => {
      tenantMap[tenant.id] = tenant.name;
    });
    
    console.log('\n🏢 Transactions by Tenant:');
    tenantTransactionCounts.slice(0, 10).forEach(tenant => {
      console.log(`  ${tenantMap[tenant.tenantId] || 'Unknown'}: ${tenant._count.tenantId} transactions`);
    });
    
    if (tenantTransactionCounts.length > 10) {
      console.log(`  ... and ${tenantTransactionCounts.length - 10} more tenants`);
    }
    
    // Overall assessment
    console.log('\n🎯 Seeding Assessment:');
    console.log('======================');
    
    if (counts.transactions > 3000) {
      console.log('✅ Transactions: EXCELLENT - Plenty of transaction data');
    } else if (counts.transactions > 1000) {
      console.log('✅ Transactions: GOOD - Good amount of transaction data');
    } else if (counts.transactions > 100) {
      console.log('⚠️  Transactions: MODERATE - Some transaction data');
    } else {
      console.log('❌ Transactions: LOW - Limited transaction data');
    }
    
    if (counts.vouchers > 100) {
      console.log('✅ Vouchers: EXCELLENT - Good voucher coverage');
    } else if (counts.vouchers > 50) {
      console.log('✅ Vouchers: GOOD - Adequate voucher data');
    } else if (counts.vouchers > 10) {
      console.log('⚠️  Vouchers: MODERATE - Some voucher data');
    } else {
      console.log('❌ Vouchers: LOW - Limited voucher data');
    }
    
    if (counts.customers > 500) {
      console.log('✅ Customers: EXCELLENT - Great customer base');
    } else if (counts.customers > 200) {
      console.log('✅ Customers: GOOD - Good customer coverage');
    } else {
      console.log('⚠️  Customers: MODERATE - Limited customer data');
    }
    
    console.log('\n🎉 Database seeding check complete!');
    
  } catch (error) {
    console.error('❌ Error checking transaction seeding:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionSeeding();
