const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔧 Creating superadmin account...\n');
    
    const plainPassword = 'password123';
    const hashedPassword = await hash(plainPassword, 12);
    
    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@localperks.com'
      }
    });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Superadmin already exists!');
      console.log(`   - Email: ${existingSuperAdmin.email}`);
      console.log(`   - Role: ${existingSuperAdmin.role}`);
      return;
    }
    
    // Create superadmin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: 'superadmin@localperks.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    
    console.log('✅ Superadmin created successfully!');
    console.log(`   - ID: ${superAdmin.id}`);
    console.log(`   - Email: ${superAdmin.email}`);
    console.log(`   - Name: ${superAdmin.name}`);
    console.log(`   - Role: ${superAdmin.role}`);
    console.log(`   - Password: ${plainPassword}`);
    console.log(`   - Email Verified: Yes`);
    console.log(`   - Approval Status: ACTIVE`);
    
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: superadmin@localperks.com`);
    console.log(`   Password: password123`);
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();

