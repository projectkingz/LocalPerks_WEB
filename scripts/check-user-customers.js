import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserCustomers() {
  try {
    console.log('🔍 Checking users with CUSTOMER role...\n');

    const customerUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        tenantId: true
      }
    });

    console.log(`👤 Users with CUSTOMER role: ${customerUsers.length}\n`);

    if (customerUsers.length > 0) {
      console.log('👥 Customer users:');
      customerUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Points: ${user.points}`);
        console.log(`   - Tenant ID: ${user.tenantId}`);
        console.log(`   - Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('No users with CUSTOMER role found.');
    }

    // Also check all users to see what roles exist
    const allUsers = await prisma.user.findMany({
      select: { role: true, email: true },
      orderBy: { role: 'asc' }
    });

    console.log('\n📊 All users by role:');
    const roleCounts = {};
    allUsers.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error checking user customers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCustomers();
