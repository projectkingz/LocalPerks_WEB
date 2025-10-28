const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAdminDetails() {
  try {
    console.log('🔍 Checking for admin users...\n');
    
    // Check for users with admin role
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin']
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`👑 Admin Users Found: ${adminUsers.length}`);
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin Details:`);
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - Created: ${admin.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check for any users with specific admin patterns
    const allUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'admin' } },
          { email: { contains: 'super' } },
          { role: { contains: 'ADMIN' } }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    if (allUsers.length > adminUsers.length) {
      console.log(`\n🔍 Additional users with admin-related patterns: ${allUsers.length - adminUsers.length}`);
      allUsers.forEach((user, index) => {
        if (!adminUsers.some(admin => admin.id === user.id)) {
          console.log(`\n${index + 1}. User Details:`);
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Role: ${user.role}`);
          console.log(`   - Created: ${user.createdAt.toISOString().split('T')[0]}`);
        }
      });
    }
    
    // Check if there are any seed files that might contain admin credentials
    console.log('\n📝 Note: If you need to create a superadmin, check your seed files for admin creation scripts.');
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getAdminDetails();

