const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTinaAllen() {
  try {
    console.log('🔍 Checking for Tina Allen in the database...');
    
    // Search for Tina Allen by name
    const customersByName = await prisma.customer.findMany({
      where: {
        name: {
          contains: 'Tina Allen'
        }
      },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n👤 Customers found by name "Tina Allen":');
    customersByName.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} - ${customer.email} - ${customer.tenant?.name} - ${customer.points} points`);
    });
    
    // Search for Tina Allen by email pattern
    const customersByEmail = await prisma.customer.findMany({
      where: {
        email: {
          contains: 'tina.allen'
        }
      },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n📧 Customers found by email containing "tina.allen":');
    customersByEmail.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} - ${customer.email} - ${customer.tenant?.name} - ${customer.points} points`);
    });
    
    // Search for the specific email mentioned in the error
    const specificCustomer = await prisma.customer.findUnique({
      where: { email: 'tina.allen900@example.com' },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n🎯 Specific customer tina.allen900@example.com:');
    if (specificCustomer) {
      console.log(`  ✅ Found: ${specificCustomer.name} - ${specificCustomer.email} - ${specificCustomer.tenant?.name} - ${specificCustomer.points} points`);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Also check users table
    const userByEmail = await prisma.user.findUnique({
      where: { email: 'tina.allen900@example.com' },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n👥 User tina.allen900@example.com:');
    if (userByEmail) {
      console.log(`  ✅ Found: ${userByEmail.name} - ${userByEmail.email} - ${userByEmail.tenant?.name} - Role: ${userByEmail.role}`);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Check all Tina Allen variations
    console.log('\n🔍 All Tina Allen variations in the database:');
    const allTinaVariations = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: 'Tina' } },
          { email: { contains: 'tina' } }
        ]
      },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    allTinaVariations.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} - ${customer.email} - ${customer.tenant?.name} - ${customer.points} points`);
    });
    
  } catch (error) {
    console.error('❌ Error checking Tina Allen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTinaAllen();
