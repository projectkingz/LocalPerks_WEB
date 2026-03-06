const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for superadmin account...\n');
    
    // Check for superadmin specifically
    const superAdmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@localperks.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        approvalStatus: true
      }
    });
    
    if (superAdmin) {
      console.log('✅ Superadmin account found:');
      console.log(`   - ID: ${superAdmin.id}`);
      console.log(`   - Email: ${superAdmin.email}`);
      console.log(`   - Name: ${superAdmin.name}`);
      console.log(`   - Role: ${superAdmin.role}`);
      console.log(`   - Created: ${superAdmin.createdAt.toISOString().split('T')[0]}`);
      console.log(`   - Email Verified: ${superAdmin.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   - Approval Status: ${superAdmin.approvalStatus}`);
    } else {
      console.log('❌ Superadmin account NOT found');
      console.log('   - Email: superadmin@localperks.com');
      console.log('   - This account needs to be created');
    }
    
    // Check all users with SUPER_ADMIN role
    const allSuperAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`\n👑 All SUPER_ADMIN users: ${allSuperAdmins.length}`);
    allSuperAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Super Admin:`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Name: ${admin.name}`);
      console.log(`   - Created: ${admin.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check all admin users
    const allAdmins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`\n👥 All Admin users (ADMIN + SUPER_ADMIN): ${allAdmins.length}`);
    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin:`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Name: ${admin.name}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - Created: ${admin.createdAt.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking superadmin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();

