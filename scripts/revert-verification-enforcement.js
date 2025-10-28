const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revertVerificationEnforcement() {
  try {
    console.log('\n🔄 Reverting verification enforcement...\n');

    // Find all users with PENDING_EMAIL_VERIFICATION status
    const pendingUsers = await prisma.user.findMany({
      where: {
        approvalStatus: 'PENDING_EMAIL_VERIFICATION',
        suspended: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`📊 Found ${pendingUsers.length} users to revert\n`);

    if (pendingUsers.length === 0) {
      console.log('✅ No users need to be reverted');
      return;
    }

    // Revert each user back to ACTIVE
    let customersReverted = 0;
    let partnersReverted = 0;
    let adminsReverted = 0;

    for (const user of pendingUsers) {
      console.log(`📝 Reverting ${user.email} (${user.role})...`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          suspended: false,
          approvalStatus: 'ACTIVE',
        },
      });

      if (user.role === 'CUSTOMER') {
        customersReverted++;
      } else if (user.role === 'PARTNER') {
        partnersReverted++;
      } else {
        adminsReverted++;
      }
    }

    console.log('\n✅ Revert Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Customers reverted: ${customersReverted}`);
    console.log(`   Partners reverted: ${partnersReverted}`);
    console.log(`   Admins reverted: ${adminsReverted}`);
    console.log(`   Total reverted: ${customersReverted + partnersReverted + adminsReverted}`);
    console.log('\n✅ All users are now back to ACTIVE status\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertVerificationEnforcement();







