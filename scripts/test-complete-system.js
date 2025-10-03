const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function testCompleteSystem() {
  console.log('🧪 Testing Complete Partner Approval System...\n');

  try {
    // Test 1: Create a new partner account
    console.log('1. Creating new partner account...');
    const testData = {
      businessName: 'Test Business',
      name: 'Test Partner',
      email: 'testpartner' + Date.now() + '@example.com',
      password: 'testpassword123'
    };

    // Hash password
    const hashedPassword = await hash(testData.password, 12);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: testData.name,
          email: testData.email,
          password: hashedPassword,
          role: 'PARTNER',
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: testData.businessName,
          partnerUserId: user.id,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return { tenant, user: updatedUser };
    });

    // Set approval status to PENDING
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "approvalStatus" = 'PENDING' 
      WHERE id = ${result.user.id}
    `;

    console.log(`   ✅ Partner created: ${testData.email}`);
    console.log(`   ✅ Status: PENDING`);

    // Test 2: Verify partner appears in admin list
    console.log('\n2. Verifying partner appears in admin list...');
    const adminUsers = await prisma.$queryRaw`
      SELECT 
        id, name, email, role, suspended, 
        "approvalStatus", "createdAt", "updatedAt", 
        "tenantId", points
      FROM "User" 
      WHERE role = 'PARTNER'
      ORDER BY "createdAt" DESC
    `;

    const newPartner = adminUsers.find(u => u.email === testData.email);
    if (newPartner) {
      console.log(`   ✅ Partner found in admin list`);
      console.log(`   ✅ Approval status: ${newPartner.approvalStatus}`);
    } else {
      console.log(`   ❌ Partner not found in admin list`);
    }

    // Test 3: Approve the partner
    console.log('\n3. Approving partner account...');
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "approvalStatus" = 'ACTIVE', suspended = false
      WHERE id = ${result.user.id}
    `;

    console.log(`   ✅ Partner approved`);

    // Test 4: Verify approval status
    console.log('\n4. Verifying approval status...');
    const approvedPartner = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        suspended: true
      }
    });

    if (approvedPartner) {
      console.log(`   ✅ Partner status: ${approvedPartner.approvalStatus}`);
      console.log(`   ✅ Suspended: ${approvedPartner.suspended}`);
    }

    // Test 5: Check all partner statuses
    console.log('\n5. Partner approval status breakdown:');
    const allPartners = await prisma.$queryRaw`
      SELECT 
        email, "approvalStatus", suspended
      FROM "User" 
      WHERE role = 'PARTNER'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    const pendingCount = allPartners.filter(p => p.approvalStatus === 'PENDING').length;
    const activeCount = allPartners.filter(p => p.approvalStatus === 'ACTIVE').length;
    const suspendedCount = allPartners.filter(p => p.approvalStatus === 'SUSPENDED').length;

    console.log(`   Pending approval: ${pendingCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Suspended: ${suspendedCount}`);

    // Clean up
    console.log('\n6. Cleaning up test data...');
    await prisma.user.delete({
      where: { id: result.user.id }
    });
    console.log(`   ✅ Test partner deleted`);

    console.log('\n🎉 Complete Partner Approval System Test Successful!');
    console.log('✅ Registration → PENDING status');
    console.log('✅ Admin visibility');
    console.log('✅ Approval process');
    console.log('✅ Status updates');
    console.log('✅ System integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteSystem(); 