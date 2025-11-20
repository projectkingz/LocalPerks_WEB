import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCustomersToMultiTenant() {
  try {
    console.log('🔄 Updating customers to multi-tenant model...\n');

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true
      }
    });

    console.log(`Found ${customers.length} customers to update:`);
    customers.forEach(customer => {
      console.log(`- ${customer.name} (${customer.email}) - Current tenant: ${customer.tenantId || 'None'}`);
    });

    if (customers.length > 0) {
      console.log('\n🔧 Removing tenant assignments from customers...');
      
      // Update all customers to have null tenantId (multi-tenant)
      const updateResult = await prisma.customer.updateMany({
        data: {
          tenantId: null
        }
      });

      console.log(`✅ Updated ${updateResult.count} customers to multi-tenant model`);

      // Verify the update
      const updatedCustomers = await prisma.customer.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          tenantId: true
        }
      });

      console.log('\n📊 Updated customers:');
      updatedCustomers.forEach(customer => {
        console.log(`- ${customer.name} (${customer.email}) - Tenant: ${customer.tenantId || 'Multi-tenant'}`);
      });

      console.log('\n✅ All customers are now multi-tenant!');
      console.log('   - Customers can now transact with any tenant/partner');
      console.log('   - Customers can earn points at any partner');
      console.log('   - Customers can redeem points at any partner');
    } else {
      console.log('No customers found to update');
    }

  } catch (error) {
    console.error('❌ Error updating customers to multi-tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomersToMultiTenant();
