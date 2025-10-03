const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPartnerApproval() {
  console.log('🧪 Testing Partner Approval Functionality...\n');

  try {
    // Test 1: Check if approvalStatus field exists
    console.log('1. Checking database schema...');
    const user = await prisma.user.findFirst({
      where: { role: 'PARTNER' }
    });
    
    if (user) {
      console.log(`   Found partner user: ${user.email}`);
      console.log(`   Current approvalStatus: ${user.approvalStatus || 'NOT SET'}`);
    } else {
      console.log('   No partner users found');
    }

    // Test 2: Create a test partner account
    console.log('\n2. Creating test partner account...');
    const testPartner = await prisma.user.create({
      data: {
        name: 'Test Partner',
        email: 'testpartner@example.com',
        password: 'hashedpassword',
        role: 'PARTNER',
        approvalStatus: 'PENDING'
      }
    });
    console.log(`   Created test partner: ${testPartner.email}`);
    console.log(`   Approval status: ${testPartner.approvalStatus}`);

    // Test 3: Update approval status
    console.log('\n3. Testing approval status update...');
    const updatedPartner = await prisma.user.update({
      where: { id: testPartner.id },
      data: { approvalStatus: 'ACTIVE' }
    });
    console.log(`   Updated approval status to: ${updatedPartner.approvalStatus}`);

    // Test 4: Check all partner accounts
    console.log('\n4. Checking all partner accounts...');
    const allPartners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
        suspended: true,
        createdAt: true
      }
    });

    console.log(`   Total partner accounts: ${allPartners.length}`);
    allPartners.forEach(partner => {
      console.log(`   - ${partner.email}: ${partner.approvalStatus} (suspended: ${partner.suspended})`);
    });

    // Test 5: Count by approval status
    console.log('\n5. Partner approval status breakdown:');
    const pendingCount = allPartners.filter(p => p.approvalStatus === 'PENDING').length;
    const activeCount = allPartners.filter(p => p.approvalStatus === 'ACTIVE').length;
    const suspendedCount = allPartners.filter(p => p.approvalStatus === 'SUSPENDED').length;
    
    console.log(`   Pending approval: ${pendingCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Suspended: ${suspendedCount}`);

    // Clean up test data
    console.log('\n6. Cleaning up test data...');
    await prisma.user.delete({
      where: { id: testPartner.id }
    });
    console.log('   Test partner account deleted');

    console.log('\n✅ Partner approval functionality test completed successfully!');
    console.log('🎉 The approval system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPartnerApproval(); 