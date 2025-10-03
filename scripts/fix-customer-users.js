const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCustomerUsers() {
  try {
    console.log('Starting to fix customer User records...');

    // Get all customers
    const customers = await prisma.customer.findMany();
    console.log(`Found ${customers.length} customers`);

    let createdCount = 0;
    let existingCount = 0;

    for (const customer of customers) {
      // Check if User record already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: customer.email }
      });

      if (existingUser) {
        console.log(`User record already exists for customer: ${customer.email}`);
        existingCount++;
      } else {
        // Create User record for customer
        const user = await prisma.user.create({
          data: {
            email: customer.email,
            name: customer.name,
            role: 'customer',
            tenantId: customer.tenantId
          }
        });
        console.log(`Created User record for customer: ${customer.email} (ID: ${user.id})`);
        createdCount++;
      }
    }

    console.log('\nSummary:');
    console.log(`- Total customers: ${customers.length}`);
    console.log(`- Existing User records: ${existingCount}`);
    console.log(`- New User records created: ${createdCount}`);

  } catch (error) {
    console.error('Error fixing customer User records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixCustomerUsers(); 