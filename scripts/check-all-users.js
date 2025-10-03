const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    console.log('Checking all users and their suspended status...\n');

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total users: ${allUsers.length}`);
    console.log(`Suspended users: ${allUsers.filter(u => u.suspended).length}`);
    console.log(`Active users: ${allUsers.filter(u => !u.suspended).length}\n`);

    console.log('All users:');
    allUsers.forEach((user, index) => {
      const status = user.suspended ? '❌ SUSPENDED' : '✅ ACTIVE';
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - ${user.role} - ${status}`);
    });

    // Check if there are any users with null suspended field
    const usersWithNullSuspended = allUsers.filter(u => u.suspended === null);
    if (usersWithNullSuspended.length > 0) {
      console.log(`\n⚠️  Users with null suspended field: ${usersWithNullSuspended.length}`);
      usersWithNullSuspended.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });
    }

    // Check auth config logic
    console.log('\n=== Auth Config Analysis ===');
    console.log('The auth config checks: user.suspended === true');
    console.log('If suspended is null or undefined, it should be treated as false');
    console.log('If suspended is true, user will be redirected to signin with error');

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers(); 