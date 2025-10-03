const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugCustomers() {
  try {
    console.log('=== CUSTOMER DEBUG ===');
    
    // Find Alice customers
    const aliceCustomers = await prisma.customer.findMany({
      where: { 
        email: { contains: 'alice' } 
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        tenantId: true 
      }
    });
    
    console.log('Alice customers found:', aliceCustomers.length);
    aliceCustomers.forEach(c => {
      console.log(`- ${c.email} (${c.name}) - Tenant: ${c.tenantId}`);
    });
    
    // Find partner users and their tenants
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        tenantId: true 
      },
      take: 5
    });
    
    console.log('\nPartner users:');
    partners.forEach(p => {
      console.log(`- ${p.email} (${p.name}) - Tenant: ${p.tenantId}`);
    });
    
    // Check if the specific customer exists
    const specificCustomer = await prisma.customer.findFirst({
      where: { email: 'alice1@johnson1@example.com' },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        tenantId: true 
      }
    });
    
    console.log('\nSpecific customer (alice1@johnson1@example.com):');
    if (specificCustomer) {
      console.log(`- Found: ${specificCustomer.email} - Tenant: ${specificCustomer.tenantId}`);
    } else {
      console.log('- Not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCustomers();
