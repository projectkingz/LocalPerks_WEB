const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function testCascadeDeletion() {
  try {
    console.log('🧪 Testing cascade deletion behavior...\n');
    
    // Create a test partner user
    const hashedPassword = await hash('test123', 12);
    const timestamp = Date.now();
    const testPartner = await prisma.user.create({
      data: {
        name: 'Test Partner',
        email: `test-partner-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'PARTNER',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    
    console.log(`✅ Created test partner: ${testPartner.email} (ID: ${testPartner.id})`);
    
    // Create a test tenant for this partner
    const testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Business',
        partnerUserId: testPartner.id,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      },
    });
    
    console.log(`✅ Created test tenant: ${testTenant.name} (ID: ${testTenant.id})`);
    
    // Create a test customer for this tenant
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `test-customer-${timestamp}@example.com`,
        mobile: '1234567890',
        tenantId: testTenant.id,
      },
    });
    
    console.log(`✅ Created test customer: ${testCustomer.email} (ID: ${testCustomer.id})`);
    
    // Create a test transaction
    const testTransaction = await prisma.transaction.create({
      data: {
        amount: 50.00,
        points: 50,
        type: 'PURCHASE',
        customerId: testCustomer.id,
        userId: testPartner.id,
        tenantId: testTenant.id,
      },
    });
    
    console.log(`✅ Created test transaction: £${testTransaction.amount} (ID: ${testTransaction.id})`);
    
    // Verify all data exists
    const partnerCount = await prisma.user.count({ where: { id: testPartner.id } });
    const tenantCount = await prisma.tenant.count({ where: { id: testTenant.id } });
    const customerCount = await prisma.customer.count({ where: { id: testCustomer.id } });
    const transactionCount = await prisma.transaction.count({ where: { id: testTransaction.id } });
    
    console.log('\n📊 Before deletion:');
    console.log(`   - Partner exists: ${partnerCount > 0}`);
    console.log(`   - Tenant exists: ${tenantCount > 0}`);
    console.log(`   - Customer exists: ${customerCount > 0}`);
    console.log(`   - Transaction exists: ${transactionCount > 0}`);
    
    // Now test cascade deletion by deleting the partner
    console.log('\n🗑️  Testing cascade deletion by deleting partner...');
    await prisma.user.delete({
      where: { id: testPartner.id }
    });
    
    console.log('✅ Partner deleted');
    
    // Check what was cascade deleted
    const partnerCountAfter = await prisma.user.count({ where: { id: testPartner.id } });
    const tenantCountAfter = await prisma.tenant.count({ where: { id: testTenant.id } });
    const customerCountAfter = await prisma.customer.count({ where: { id: testCustomer.id } });
    const transactionCountAfter = await prisma.transaction.count({ where: { id: testTransaction.id } });
    
    console.log('\n📊 After deletion:');
    console.log(`   - Partner exists: ${partnerCountAfter > 0}`);
    console.log(`   - Tenant exists: ${tenantCountAfter > 0}`);
    console.log(`   - Customer exists: ${customerCountAfter > 0}`);
    console.log(`   - Transaction exists: ${transactionCountAfter > 0}`);
    
    // Verify cascade behavior
    if (partnerCountAfter === 0 && tenantCountAfter === 0) {
      console.log('\n🎉 SUCCESS: Cascade deletion is working!');
      console.log('   ✅ Partner was deleted');
      console.log('   ✅ Tenant was automatically deleted (cascade)');
      
      if (customerCountAfter === 0 && transactionCountAfter === 0) {
        console.log('   ✅ Customer and Transaction were also deleted');
        console.log('   ✅ Complete cascade deletion working perfectly!');
      } else {
        console.log('   ⚠️  Customer and Transaction still exist (expected if they have other relationships)');
      }
    } else {
      console.log('\n❌ FAILED: Cascade deletion not working properly');
      console.log('   Partner should be deleted, Tenant should be cascade deleted');
    }
    
  } catch (error) {
    console.error('❌ Error during cascade deletion test:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCascadeDeletion();
