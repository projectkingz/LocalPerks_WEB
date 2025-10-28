const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserVerification() {
  try {
    const email = 'tina.allen900@example.com';
    
    console.log(`\n🔍 Checking verification status for: ${email}\n`);
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Details:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Suspended: ${user.suspended}`);
    console.log(`   Approval Status: ${user.approvalStatus}`);
    console.log(`   Created: ${user.createdAt}`);

    // Get customer details
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { email },
        select: {
          mobile: true,
          points: true,
        },
      });

      if (customer) {
        console.log(`\n📱 Customer Details:`);
        console.log(`   Mobile: ${customer.mobile || 'Not set'}`);
        console.log(`   Points: ${customer.points}`);
      }
    }

    // Check if they need verification
    console.log(`\n🔐 Verification Status:`);
    if (user.approvalStatus === 'PENDING_EMAIL_VERIFICATION') {
      console.log('   ⚠️  Email verification PENDING');
    } else if (user.approvalStatus === 'PENDING_MOBILE_VERIFICATION') {
      console.log('   ⚠️  Mobile verification PENDING');
    } else if (user.approvalStatus === 'ACTIVE') {
      console.log('   ✅ All verifications complete');
    } else {
      console.log(`   ℹ️  Status: ${user.approvalStatus}`);
    }

    if (user.suspended) {
      console.log('   ⚠️  Account is SUSPENDED');
    } else {
      console.log('   ✅ Account is ACTIVE');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserVerification();







