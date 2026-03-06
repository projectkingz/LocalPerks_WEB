const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestCustomer() {
  try {
    console.log('=== CREATING TEST CUSTOMER ===');
    
    // Find Sarah Johnson's tenant (the partner we're testing with)
    const partner = await prisma.user.findFirst({
      where: { email: 'sarah.johnson@business.com' },
      select: { id: true, email: true, name: true, tenantId: true }
    });
    
    if (!partner) {
      console.log('Partner not found');
      return;
    }
    
    console.log('Partner found:', partner.email, 'Tenant:', partner.tenantId);
    
    // Create test customer for this tenant
    const testCustomer = await prisma.customer.create({
      data: {
        email: 'alice1@johnson1@example.com',
        name: 'Alice Johnson Test',
        tenantId: partner.tenantId,
        points: 0,
        mobile: '1234567890'
      }
    });
    
    console.log('Test customer created:', testCustomer);
    
    // Verify it was created
    const verifyCustomer = await prisma.customer.findFirst({
      where: { email: 'alice1@johnson1@example.com' },
      select: { id: true, email: true, name: true, tenantId: true }
    });
    
    console.log('Verification - Customer found:', verifyCustomer);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCustomer();
