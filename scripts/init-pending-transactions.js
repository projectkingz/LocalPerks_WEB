// Script to initialize pending transactions for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeSamplePendingTransactions() {
  console.log('Initializing pending transactions...');
  
  try {
    // Get a sample customer
    const customer = await prisma.customer.findFirst();
    
    if (!customer) {
      console.log('No customers found. Please create a customer first.');
      return;
    }

    // Get or create a user for the customer
    let user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name,
          role: 'CUSTOMER',
          tenantId: customer.tenantId
        }
      });
    }

    // Create sample pending transactions
    const sampleTransactions = [
      {
        amount: 15.50,
        points: 155,
        type: 'EARNED',
        status: 'PENDING',
        description: 'Coffee purchase receipt',
        userId: user.id,
        customerId: customer.id,
        tenantId: customer.tenantId
      },
      {
        amount: 22.75,
        points: 227,
        type: 'EARNED',
        status: 'PENDING',
        description: 'Lunch order receipt',
        userId: user.id,
        customerId: customer.id,
        tenantId: customer.tenantId
      },
      {
        amount: 8.99,
        points: 89,
        type: 'EARNED',
        status: 'PENDING',
        description: 'Snack purchase receipt',
        userId: user.id,
        customerId: customer.id,
        tenantId: customer.tenantId
      }
    ];

    for (const transactionData of sampleTransactions) {
      await prisma.transaction.create({
        data: transactionData
      });
    }

    console.log(`Created ${sampleTransactions.length} sample pending transactions for customer: ${customer.email}`);
    console.log('Done! You can now test the pending approvals functionality.');
  } catch (error) {
    console.error('Error initializing pending transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeSamplePendingTransactions(); 