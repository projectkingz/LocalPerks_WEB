const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Starting comprehensive database cleanup...\n');
    
    // Check current data
    const partnerCount = await prisma.user.count({ where: { role: 'PARTNER' } });
    const customerCount = await prisma.customer.count();
    const transactionCount = await prisma.transaction.count();
    const tenantCount = await prisma.tenant.count();
    
    console.log(`📊 Current data:`);
    console.log(`   - Partners: ${partnerCount}`);
    console.log(`   - Customers: ${customerCount}`);
    console.log(`   - Transactions: ${transactionCount}`);
    console.log(`   - Tenants: ${tenantCount}`);
    
    if (partnerCount === 0 && customerCount === 0 && transactionCount === 0 && tenantCount === 0) {
      console.log('✅ Database is already clean.');
      return;
    }
    
    console.log('\n🗑️  Starting deletion process (in correct order)...');
    
    // Delete in the correct order to respect foreign key constraints
    // 1. Delete transactions first (they reference customers and tenants)
    console.log('1. Deleting transactions...');
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTransactions.count} transactions`);
    
    // 2. Delete redemptions (they reference customers and rewards)
    console.log('2. Deleting redemptions...');
    const deletedRedemptions = await prisma.redemption.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRedemptions.count} redemptions`);
    
    // 3. Delete rewards (they reference tenants)
    console.log('3. Deleting rewards...');
    const deletedRewards = await prisma.reward.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRewards.count} rewards`);
    
    // 4. Delete vouchers (they reference tenants)
    console.log('4. Deleting vouchers...');
    const deletedVouchers = await prisma.voucher.deleteMany({});
    console.log(`   ✅ Deleted ${deletedVouchers.count} vouchers`);
    
    // 5. Delete tenant points configs (they reference tenants)
    console.log('5. Deleting tenant points configs...');
    const deletedTenantPointsConfigs = await prisma.tenantPointsConfig.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTenantPointsConfigs.count} tenant points configs`);
    
    // 6. Delete customers (they reference tenants)
    console.log('6. Deleting customers...');
    const deletedCustomers = await prisma.customer.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCustomers.count} customers`);
    
    // 7. Delete tenants (they reference partner users)
    console.log('7. Deleting tenants...');
    const deletedTenants = await prisma.tenant.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTenants.count} tenants`);
    
    // 8. Finally, delete partner users
    console.log('8. Deleting partner users...');
    const deletedPartners = await prisma.user.deleteMany({
      where: { role: 'PARTNER' }
    });
    console.log(`   ✅ Deleted ${deletedPartners.count} partner users`);
    
    // Verify cleanup
    const remainingPartners = await prisma.user.count({ where: { role: 'PARTNER' } });
    const remainingCustomers = await prisma.customer.count();
    const remainingTransactions = await prisma.transaction.count();
    const remainingTenants = await prisma.tenant.count();
    
    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Final counts:`);
    console.log(`   - Remaining partners: ${remainingPartners}`);
    console.log(`   - Remaining customers: ${remainingCustomers}`);
    console.log(`   - Remaining transactions: ${remainingTransactions}`);
    console.log(`   - Remaining tenants: ${remainingTenants}`);
    
    if (remainingPartners === 0 && remainingCustomers === 0 && remainingTransactions === 0 && remainingTenants === 0) {
      console.log('🎉 All partners, customers, transactions, and tenants have been successfully removed!');
    } else {
      console.log('⚠️  Some data may still remain. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
