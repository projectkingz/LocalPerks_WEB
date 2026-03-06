const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalCleanup() {
  try {
    console.log('🧹 Final cleanup - handling remaining tenants and partners...\n');
    
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
    
    console.log('\n🗑️  Final deletion process...');
    
    // Strategy: Delete tenants first by setting their user reference to null, then delete partners
    console.log('1. Updating tenants to remove user references...');
    
    // Get all tenants and their associated users
    const tenants = await prisma.tenant.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`   Found ${tenants.length} tenants to process`);
    
    // Update each tenant to remove the user reference
    for (const tenant of tenants) {
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { userId: null }
        });
      } catch (error) {
        console.log(`   ⚠️  Could not update tenant ${tenant.id}: ${error.message}`);
      }
    }
    
    console.log('2. Deleting tenants...');
    const deletedTenants = await prisma.tenant.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTenants.count} tenants`);
    
    console.log('3. Deleting partner users...');
    const deletedPartners = await prisma.user.deleteMany({
      where: { role: 'PARTNER' }
    });
    console.log(`   ✅ Deleted ${deletedPartners.count} partner users`);
    
    // Verify final cleanup
    const remainingPartners = await prisma.user.count({ where: { role: 'PARTNER' } });
    const remainingTenants = await prisma.tenant.count();
    const remainingCustomers = await prisma.customer.count();
    const remainingTransactions = await prisma.transaction.count();
    
    console.log('\n✅ Final cleanup completed!');
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
    console.error('❌ Error during final cleanup:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

finalCleanup();
