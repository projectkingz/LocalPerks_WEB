const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPendingTransactions() {
  try {
    console.log('🧪 Testing Pending Transactions...\n');

    // 1. Check existing pending transactions
    console.log('1. Checking existing pending transactions...');
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          }
        },
        tenant: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${pendingTransactions.length} pending transactions in database`);
    
    if (pendingTransactions.length > 0) {
      console.log('\nSample pending transactions:');
      pendingTransactions.slice(0, 5).forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.customer.name} (${transaction.customer.email})`);
        console.log(`     Amount: £${transaction.amount.toFixed(2)}`);
        console.log(`     Points: ${transaction.points}`);
        console.log(`     Type: ${transaction.type}`);
        console.log(`     Tenant: ${transaction.tenant.name}`);
        console.log(`     Created: ${transaction.createdAt.toDateString()}`);
        console.log('');
      });
    }

    // 2. Check transaction status distribution
    console.log('2. Checking transaction status distribution...');
    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('Transaction status distribution:');
    statusCounts.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status}`);
    });

    // 3. Check customers with pending transactions
    console.log('\n3. Checking customers with pending transactions...');
    const customersWithPending = await prisma.customer.findMany({
      where: {
        transactions: {
          some: {
            status: 'PENDING'
          }
        }
      },
      include: {
        transactions: {
          where: {
            status: 'PENDING'
          }
        },
        _count: {
          select: {
            transactions: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }
      }
    });

    console.log(`Found ${customersWithPending.length} customers with pending transactions`);
    
    if (customersWithPending.length > 0) {
      console.log('\nCustomers with pending transactions:');
      customersWithPending.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.name} (${customer.email})`);
        console.log(`     Pending transactions: ${customer._count.transactions}`);
        console.log(`     Current points: ${customer.points}`);
      });
    }

    // 4. Test creating a sample pending transaction
    console.log('\n4. Testing creation of a sample pending transaction...');
    
    // Find a customer to use for testing
    const testCustomer = await prisma.customer.findFirst({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });

    if (testCustomer) {
      console.log(`Using test customer: ${testCustomer.name} (${testCustomer.email})`);
      
      // Find or create a user record for this customer
      let user = await prisma.user.findFirst({
        where: {
          email: testCustomer.email
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: testCustomer.email,
            name: testCustomer.name,
            role: 'CUSTOMER'
          }
        });
        console.log(`Created user record for customer: ${user.id}`);
      }

      // Create a test pending transaction
      const testTransaction = await prisma.transaction.create({
        data: {
          amount: 25.50,
          points: 25,
          type: 'EARNED',
          status: 'PENDING',
          userId: user.id,
          customerId: testCustomer.id,
          tenantId: testCustomer.tenantId,
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            }
          },
          tenant: {
            select: {
              name: true,
            }
          }
        }
      });

      console.log(`Created test pending transaction: ${testTransaction.id}`);
      console.log(`  Customer: ${testTransaction.customer.name}`);
      console.log(`  Amount: £${testTransaction.amount.toFixed(2)}`);
      console.log(`  Points: ${testTransaction.points}`);
      console.log(`  Status: ${testTransaction.status}`);

      // Clean up - delete the test transaction
      await prisma.transaction.delete({
        where: {
          id: testTransaction.id
        }
      });
      console.log('Test transaction cleaned up');
    } else {
      console.log('No test customer found with example.com email');
    }

    // 5. Check transaction relationships
    console.log('\n5. Checking transaction relationships...');
    const transactionWithRelations = await prisma.transaction.findFirst({
      include: {
        customer: true,
        user: true,
        tenant: true,
      }
    });

    if (transactionWithRelations) {
      console.log('Transaction relationships are working correctly');
      console.log(`  - Customer: ${transactionWithRelations.customer.name}`);
      console.log(`  - User: ${transactionWithRelations.user.name}`);
      console.log(`  - Tenant: ${transactionWithRelations.tenant.name}`);
      console.log(`  - Status: ${transactionWithRelations.status}`);
    } else {
      console.log('No transactions found to test relationships');
    }

    console.log('\n✅ Pending transactions test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing pending transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPendingTransactions(); 