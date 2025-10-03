const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseRegistration() {
  console.log('🧪 Testing Database Registration Logic...\n');

  try {
    const testData = {
      businessName: 'Test Coffee Shop',
      name: 'John Test Partner',
      email: 'testpartner' + Date.now() + '@example.com',
      password: 'testpassword123'
    };

    console.log('1. Testing registration logic...');
    console.log(`   Email: ${testData.email}`);
    console.log(`   Business: ${testData.businessName}`);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testData.email },
    });

    if (existingUser) {
      console.log('❌ Email already exists');
      return;
    }

    // Hash password
    const hashedPassword = await hash(testData.password, 12);
    console.log('   Password hashed successfully');

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with hashed password first
      const user = await tx.user.create({
        data: {
          name: testData.name,
          email: testData.email,
          password: hashedPassword,
          role: 'PARTNER',
        },
      });

      console.log('   User created successfully');

      // Create tenant with the partner user
      const tenant = await tx.tenant.create({
        data: {
          name: testData.businessName,
          partnerUserId: user.id,
        },
      });

      console.log('   Tenant created successfully');

      // Update user with tenantId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return { tenant, user: updatedUser };
    });

    // Set approval status to PENDING for new partners
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "approvalStatus" = 'PENDING' 
      WHERE id = ${result.user.id}
    `;

    console.log('   Approval status set to PENDING');

    // Verify the user was created with correct status
    const finalUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        tenantId: true,
        createdAt: true
      }
    });

    console.log('✅ Registration successful!');
    console.log('   Final user data:', JSON.stringify(finalUser, null, 2));

    // Clean up test data
    console.log('\n2. Cleaning up test data...');
    await prisma.user.delete({
      where: { id: result.user.id }
    });
    console.log('   Test user deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseRegistration(); 