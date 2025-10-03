const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRoles() {
  try {
    console.log('Starting user role updates...');

    // Update users with lowercase 'user' role to 'CUSTOMER'
    const userUpdateResult = await prisma.user.updateMany({
      where: {
        role: 'user'
      },
      data: {
        role: 'CUSTOMER'
      }
    });
    console.log(`Updated ${userUpdateResult.count} users from 'user' to 'CUSTOMER'`);

    // Update users with lowercase 'customer' role to 'CUSTOMER'
    const customerUpdateResult = await prisma.user.updateMany({
      where: {
        role: 'customer'
      },
      data: {
        role: 'CUSTOMER'
      }
    });
    console.log(`Updated ${customerUpdateResult.count} users from 'customer' to 'CUSTOMER'`);

    // Update users with lowercase 'partner' role to 'PARTNER'
    const partnerUpdateResult = await prisma.user.updateMany({
      where: {
        role: 'partner'
      },
      data: {
        role: 'PARTNER'
      }
    });
    console.log(`Updated ${partnerUpdateResult.count} users from 'partner' to 'PARTNER'`);

    // Update users with 'USER' role to 'CUSTOMER' (from social login)
    const userUpperUpdateResult = await prisma.user.updateMany({
      where: {
        role: 'USER'
      },
      data: {
        role: 'CUSTOMER'
      }
    });
    console.log(`Updated ${userUpperUpdateResult.count} users from 'USER' to 'CUSTOMER'`);

    // Show final role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    console.log('\nFinal role distribution:');
    roleDistribution.forEach(group => {
      console.log(`${group.role}: ${group._count.role} users`);
    });

    console.log('\nUser role update completed successfully!');
  } catch (error) {
    console.error('Error updating user roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRoles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 