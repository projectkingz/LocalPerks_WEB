const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addTina() {
  try {
    const customer = await prisma.customer.create({
      data: {
        email: 'tina.allen900@example.com',
        name: 'Tina Allen',
        tenantId: 'cmd70i2ke00024avck8peawhd',
        points: 0,
        mobile: '1234567890'
      }
    });
    
    console.log('Created customer:', customer.email, 'for tenant:', customer.tenantId);
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addTina();
