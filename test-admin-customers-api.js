const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminCustomersAPI() {
  try {
    console.log('🔍 Testing admin customers API logic...\n');
    
    // Simulate the same query as the admin API
    const customers = await prisma.customer.findMany({
      include: {
        transactions: {
          where: {
            status: { in: ['APPROVED', 'VOID'] }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        redemptions: {
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                points: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Customers found by admin API query: ${customers.length}\n`);
    
    if (customers.length > 0) {
      console.log('👥 Customer details:');
      customers.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name} (${customer.email})`);
        console.log(`   - ID: ${customer.id}`);
        console.log(`   - Points: ${customer.points}`);
        console.log(`   - Transactions: ${customer.transactions.length}`);
        console.log(`   - Redemptions: ${customer.redemptions.length}`);
        console.log(`   - Created: ${customer.createdAt.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No customers found by admin API query');
    }
    
    // Also check if there are any issues with the include relationships
    console.log('🔍 Checking for potential issues...');
    
    // Check if there are any customers without tenant relationships
    const customersWithoutTenant = await prisma.customer.findMany({
      where: {
        tenantId: null
      }
    });
    
    console.log(`Customers without tenant: ${customersWithoutTenant.length}`);
    
    // Check if there are any customers with invalid tenantId
    const allTenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Available tenants: ${allTenants.length}`);
    allTenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing admin customers API:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminCustomersAPI();
