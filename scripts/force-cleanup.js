const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceCleanup() {
  try {
    console.log('🧹 Force cleanup using raw SQL...\n');
    
    // Check current data
    const partnerCount = await prisma.user.count({ where: { role: 'PARTNER' } });
    const tenantCount = await prisma.tenant.count();
    
    console.log(`📊 Remaining data:`);
    console.log(`   - Partners: ${partnerCount}`);
    console.log(`   - Tenants: ${tenantCount}`);
    
    if (partnerCount === 0 && tenantCount === 0) {
      console.log('✅ Database is already clean.');
      return;
    }
    
    console.log('\n🗑️  Force deletion using raw SQL...');
    
    // Use raw SQL to disable foreign key checks temporarily
    console.log('1. Disabling foreign key checks...');
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    
    console.log('2. Deleting all tenants...');
    const deletedTenants = await prisma.$executeRaw`DELETE FROM Tenant`;
    console.log(`   ✅ Deleted tenants`);
    
    console.log('3. Deleting all partner users...');
    const deletedPartners = await prisma.$executeRaw`DELETE FROM User WHERE role = 'PARTNER'`;
    console.log(`   ✅ Deleted partner users`);
    
    console.log('4. Re-enabling foreign key checks...');
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    
    // Verify final cleanup
    const remainingPartners = await prisma.user.count({ where: { role: 'PARTNER' } });
    const remainingTenants = await prisma.tenant.count();
    const remainingCustomers = await prisma.customer.count();
    const remainingTransactions = await prisma.transaction.count();
    
    console.log('\n✅ Force cleanup completed!');
    console.log(`📊 Final counts:`);
    console.log(`   - Remaining partners: ${remainingPartners}`);
    console.log(`   - Remaining tenants: ${remainingTenants}`);
    console.log(`   - Remaining customers: ${remainingCustomers}`);
    console.log(`   - Remaining transactions: ${remainingTransactions}`);
    
    if (remainingPartners === 0 && remainingTenants === 0 && remainingCustomers === 0 && remainingTransactions === 0) {
      console.log('🎉 Database cleanup completed successfully!');
      console.log('   All partners, tenants, customers, and transactions have been removed.');
    } else {
      console.log('⚠️  Some data may still remain. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to re-enable foreign key checks even if there was an error
    try {
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
      console.log('✅ Re-enabled foreign key checks');
    } catch (e) {
      console.log('⚠️  Could not re-enable foreign key checks');
    }
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanup();
