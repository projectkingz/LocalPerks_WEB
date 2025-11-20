import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRecentData() {
  console.log('🧪 Testing recent data integrity...\n');
  
  try {
    // Test 1: Check recent partners (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentPartners = await prisma.user.findMany({
      where: {
        role: 'PARTNER',
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      include: {
        partnerTenants: true
      }
    });
    
    console.log(`✅ Recent Partners: ${recentPartners.length}`);
    console.log(`   Expected: 3 (1 per month for 3 months)`);
    console.log(`   Status: ${recentPartners.length === 3 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 2: Check recent customers (last 3 months)
    const recentCustomers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      }
    });
    
    console.log(`✅ Recent Customers: ${recentCustomers.length}`);
    console.log(`   Expected: 6 (2 per month for 3 months)`);
    console.log(`   Status: ${recentCustomers.length === 6 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: Check recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        }
      },
      include: {
        customer: true,
        tenant: true
      }
    });
    
    console.log(`✅ Recent Transactions: ${recentTransactions.length}`);
    console.log(`   Expected: ${recentCustomers.length * recentPartners.length} (each customer with each partner)`);
    console.log(`   Status: ${recentTransactions.length === recentCustomers.length * recentPartners.length ? 'PASS' : 'FAIL'}\n`);
    
    // Test 4: Check transaction amounts
    if (recentTransactions.length > 0) {
      const amounts = recentTransactions.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      
      console.log(`✅ Transaction Amounts:`);
      console.log(`   Average: £${avgAmount.toFixed(2)}`);
      console.log(`   Min: £${minAmount.toFixed(2)}`);
      console.log(`   Max: £${maxAmount.toFixed(2)}`);
      console.log(`   Target Average: £127.00`);
      console.log(`   Status: ${Math.abs(avgAmount - 127) < 10 ? 'PASS' : 'FAIL'} (within £10 of target)\n`);
    }
    
    // Test 5: Check data relationships
    const customersWithTransactions = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo
        },
        transactions: {
          some: {
            createdAt: {
              gte: threeMonthsAgo
            }
          }
        }
      }
    });
    
    console.log(`✅ Data Relationships:`);
    console.log(`   Customers with transactions: ${customersWithTransactions.length}`);
    console.log(`   Expected: ${recentCustomers.length}`);
    console.log(`   Status: ${customersWithTransactions.length === recentCustomers.length ? 'PASS' : 'FAIL'}\n`);
    
    // Test 6: Check partner-customer interactions
    const uniquePartnerCustomerPairs = new Set();
    recentTransactions.forEach(t => {
      uniquePartnerCustomerPairs.add(`${t.tenantId}-${t.customerId}`);
    });
    
    console.log(`✅ Partner-Customer Interactions:`);
    console.log(`   Unique pairs: ${uniquePartnerCustomerPairs.size}`);
    console.log(`   Expected: ${recentCustomers.length * recentPartners.length}`);
    console.log(`   Status: ${uniquePartnerCustomerPairs.size === recentCustomers.length * recentPartners.length ? 'PASS' : 'FAIL'}\n`);
    
    // Summary
    const totalTests = 6;
    const passedTests = [
      recentPartners.length === 3,
      recentCustomers.length === 6,
      recentTransactions.length === recentCustomers.length * recentPartners.length,
      recentTransactions.length > 0 ? Math.abs(avgAmount - 127) < 10 : false,
      customersWithTransactions.length === recentCustomers.length,
      uniquePartnerCustomerPairs.size === recentCustomers.length * recentPartners.length
    ].filter(Boolean).length;
    
    console.log(`🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`   Status: ${passedTests === totalTests ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRecentData();
