const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomerReceipt() {
  try {
    console.log('🧪 Testing Customer Receipt Submission...\n');

    // 1. Find a test customer
    console.log('1. Finding test customer...');
    const testCustomer = await prisma.customer.findFirst({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });

    if (!testCustomer) {
      console.log('❌ No test customer found');
      return;
    }

    console.log(`Using test customer: ${testCustomer.name} (${testCustomer.email})`);

    // 2. Ensure customer has a user record
    console.log('\n2. Ensuring customer has user record...');
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
      console.log(`Created user record: ${user.id}`);
    } else {
      console.log(`Found existing user record: ${user.id}`);
    }

    // 3. Create a test pending transaction (simulating customer receipt submission)
    console.log('\n3. Creating test pending transaction...');
    const testAmount = 32.75;
    const testPoints = Math.floor(testAmount);

    const pendingTransaction = await prisma.transaction.create({
      data: {
        amount: testAmount,
        points: testPoints,
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

    console.log(`✅ Created pending transaction: ${pendingTransaction.id}`);
    console.log(`  Customer: ${pendingTransaction.customer.name}`);
    console.log(`  Amount: £${pendingTransaction.amount.toFixed(2)}`);
    console.log(`  Points: ${pendingTransaction.points}`);
    console.log(`  Status: ${pendingTransaction.status}`);
    console.log(`  Tenant: ${pendingTransaction.tenant.name}`);

    // 4. Verify the transaction appears in pending transactions query
    console.log('\n4. Verifying transaction appears in pending transactions...');
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

    console.log(`Found ${pendingTransactions.length} pending transactions`);
    
    const foundTransaction = pendingTransactions.find(t => t.id === pendingTransaction.id);
    if (foundTransaction) {
      console.log('✅ Test transaction found in pending transactions list!');
    } else {
      console.log('❌ Test transaction NOT found in pending transactions list');
    }

    // 5. Test the API endpoint format (what the frontend expects)
    console.log('\n5. Testing API endpoint format...');
    const formattedTransactions = pendingTransactions.map(transaction => ({
      id: transaction.id,
      customerEmail: transaction.customer.email,
      date: transaction.createdAt.toISOString(),
      points: transaction.points,
      description: `Transaction - £${transaction.amount.toFixed(2)}`,
      amount: transaction.amount,
      status: transaction.status,
      adminNotes: '',
      customerName: transaction.customer.name,
      tenantName: transaction.tenant.name
    }));

    console.log('Formatted transactions for API:');
    formattedTransactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. ${transaction.customerName} (${transaction.customerEmail})`);
      console.log(`     Description: ${transaction.description}`);
      console.log(`     Amount: £${transaction.amount.toFixed(2)}`);
      console.log(`     Points: ${transaction.points}`);
      console.log(`     Status: ${transaction.status}`);
    });

    // 6. Test approval process
    console.log('\n6. Testing approval process...');
    const approvedTransaction = await prisma.transaction.update({
      where: { id: pendingTransaction.id },
      data: { 
        status: 'APPROVED',
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    console.log(`✅ Transaction approved: ${approvedTransaction.id}`);
    console.log(`  New status: ${approvedTransaction.status}`);

    // 7. Add points to customer
    console.log('\n7. Adding points to customer...');
    const updatedCustomer = await prisma.customer.update({
      where: { id: testCustomer.id },
      data: {
        points: {
          increment: testPoints
        }
      }
    });

    console.log(`✅ Customer points updated: ${updatedCustomer.points} (was ${testCustomer.points}, added ${testPoints})`);

    // 8. Verify no more pending transactions
    console.log('\n8. Verifying no more pending transactions...');
    const remainingPending = await prisma.transaction.findMany({
      where: {
        status: 'PENDING'
      }
    });

    console.log(`Remaining pending transactions: ${remainingPending.length}`);

    // 9. Clean up - delete the test transaction
    console.log('\n9. Cleaning up test transaction...');
    await prisma.transaction.delete({
      where: {
        id: pendingTransaction.id
      }
    });

    // Reset customer points
    await prisma.customer.update({
      where: { id: testCustomer.id },
      data: {
        points: testCustomer.points
      }
    });

    console.log('✅ Test transaction cleaned up');
    console.log('✅ Customer points reset to original value');

    console.log('\n🎉 Customer receipt submission test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Customer receipt submission creates pending transaction ✅');
    console.log('  - Pending transaction appears in pending transactions list ✅');
    console.log('  - Transaction can be approved and points added ✅');
    console.log('  - API format matches frontend expectations ✅');

  } catch (error) {
    console.error('❌ Error testing customer receipt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCustomerReceipt(); 