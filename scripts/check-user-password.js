// Script to check the actual password hash in the database for sarah.johnson@business.com
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUserPassword() {
  console.log('=== CHECKING USER PASSWORD IN DATABASE ===');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'sarah.johnson@business.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        suspended: true,
        approvalStatus: true,
        tenantId: true,
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- Role:', user.role);
    console.log('- Suspended:', user.suspended);
    console.log('- Approval Status:', user.approvalStatus);
    console.log('- Tenant ID:', user.tenantId);
    console.log('- Has Password:', !!user.password);
    console.log('- Password Hash (first 30 chars):', user.password ? user.password.substring(0, 30) + '...' : 'No password');
    
    // Test password comparison
    if (user.password) {
      const testPassword = 'password123';
      console.log('\nTesting password comparison with:', testPassword);
      
      const isValid = await compare(testPassword, user.password);
      console.log('Password comparison result:', isValid);
      
      if (!isValid) {
        console.log('❌ Password comparison failed');
        console.log('This suggests the password in the database was not hashed with "password123"');
      } else {
        console.log('✅ Password comparison successful');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('=== END CHECK ===');
}

checkUserPassword();
