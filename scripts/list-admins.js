const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAdmins() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        approvalStatus: true,
        suspended: true,
      },
      orderBy: {
        role: 'desc', // SUPER_ADMIN first, then ADMIN
      }
    });

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         ADMIN ACCOUNTS                                     ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    if (users.length === 0) {
      console.log('  No admin accounts found.\n');
    } else {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.role}`);
        console.log(`     Name:   ${user.name || 'N/A'}`);
        console.log(`     Email:  ${user.email}`);
        console.log(`     Status: ${user.approvalStatus}${user.suspended ? ' (SUSPENDED)' : ''}`);
        console.log(`     Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`     ID:     ${user.id}`);
        console.log('');
      });

      console.log(`  Total: ${users.length} admin account(s)\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();


