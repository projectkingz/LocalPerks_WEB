const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSuspendedUser() {
  try {
    console.log('Testing suspended user functionality...\n');

    // Find a customer user to suspend
    const customer = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      }
    });

    if (!customer) {
      console.log('No customer found to test with');
      return;
    }

    console.log(`Found customer: ${customer.name} (${customer.email})`);
    console.log(`Current suspended status: ${customer.suspended}`);

    // Suspend the user
    const suspendedUser = await prisma.user.update({
      where: { id: customer.id },
      data: { suspended: true }
    });

    console.log(`User suspended: ${suspendedUser.suspended}`);

    // Test that the user can still be found but is suspended
    const testUser = await prisma.user.findUnique({
      where: { id: customer.id }
    });

    console.log(`Test user suspended status: ${testUser.suspended}`);

    // Unsuspend the user
    const unsuspendedUser = await prisma.user.update({
      where: { id: customer.id },
      data: { suspended: false }
    });

    console.log(`User unsuspended: ${unsuspendedUser.suspended}`);

    // Check how many suspended users exist
    const suspendedCount = await prisma.user.count({
      where: { suspended: true }
    });

    console.log(`\nTotal suspended users: ${suspendedCount}`);

    // List all suspended users
    const suspendedUsers = await prisma.user.findMany({
      where: { suspended: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true
      }
    });

    if (suspendedUsers.length > 0) {
      console.log('\nSuspended users:');
      suspendedUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    } else {
      console.log('\nNo suspended users found');
    }

  } catch (error) {
    console.error('Error testing suspended user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSuspendedUser(); 