const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCustomers() {
  try {
    console.log('🔍 Debugging customer data for admin dashboard...\n');
    
    // Get customers with tenant info (same as admin API)
    const customers = await prisma.customer.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
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

    console.log(`📊 Total customers: ${customers.length}\n`);
    
    // Check each customer's data structure
    customers.forEach((customer, index) => {
      console.log(`👤 Customer ${index + 1}:`);
      console.log(`   Name: ${customer.name}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Points: ${customer.points}`);
      console.log(`   Tenant ID: ${customer.tenantId}`);
      console.log(`   Tenant Name: ${customer.tenant?.name || 'NULL'}`);
      console.log(`   Tenant Object:`, customer.tenant);
      console.log(`   Transactions: ${customer.transactions.length}`);
      console.log(`   Redemptions: ${customer.redemptions.length}`);
      console.log(`   Created: ${customer.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Check if the issue is with tenant relationships
    console.log('🔍 Checking tenant relationships...');
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Available tenants: ${tenants.length}`);
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id})`);
    });
    
    // Check if customers have valid tenant IDs
    const customerTenantIds = customers.map(c => c.tenantId);
    const validTenantIds = tenants.map(t => t.id);
    
    console.log('\n🔍 Checking tenant ID validity...');
    customerTenantIds.forEach(tenantId => {
      const isValid = validTenantIds.includes(tenantId);
      console.log(`  Customer tenant ID ${tenantId}: ${isValid ? 'VALID' : 'INVALID'}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging customers:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCustomers();