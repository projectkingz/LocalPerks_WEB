const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceVerificationForExistingUsers() {
  try {
    console.log('\n🔄 Starting verification enforcement for existing users...\n');

    // Find all ACTIVE users (both customers and partners) who don't have pending verification
    const activeUsers = await prisma.user.findMany({
      where: {
        approvalStatus: 'ACTIVE',
        suspended: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${activeUsers.length} active users to update\n`);

    if (activeUsers.length === 0) {
      console.log('✅ No users need verification enforcement');
      return;
    }

    // Update each user to require email verification
    let customersUpdated = 0;
    let partnersUpdated = 0;

    for (const user of activeUsers) {
      console.log(`📝 Updating ${user.email} (${user.role})...`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          suspended: true,
          approvalStatus: 'PENDING_EMAIL_VERIFICATION',
        },
      });

      if (user.role === 'CUSTOMER') {
        customersUpdated++;
      } else if (user.role === 'PARTNER') {
        partnersUpdated++;
      }
    }

    console.log('\n✅ Update Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Customers updated: ${customersUpdated}`);
    console.log(`   Partners updated: ${partnersUpdated}`);
    console.log(`   Total updated: ${customersUpdated + partnersUpdated}`);
    console.log('\n⚠️  All these users will need to verify their email and mobile on next login\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceVerificationForExistingUsers();

