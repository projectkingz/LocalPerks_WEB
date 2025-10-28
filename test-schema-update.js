import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchemaUpdate() {
  try {
    console.log('🧪 Testing schema update...\n');

    // Test 1: Check if we can create a customer with null tenantId
    console.log('1. Testing customer creation with null tenantId...');
    const testCustomer = await prisma.customer.create({
      data: {
        email: `test-null-tenant-${Date.now()}@example.com`,
        name: 'Test Customer',
        mobile: '1234567890',
        tenantId: null, // This should work if schema is updated
      }
    });
    console.log('   ✅ Customer created with null tenantId:', testCustomer.id);

    // Test 2: Check if we can query customers with null tenantId
    console.log('\n2. Testing customer query with null tenantId...');
    const customersWithNullTenant = await prisma.customer.findMany({
      where: {
        tenantId: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true
      }
    });
    console.log(`   ✅ Found ${customersWithNullTenant.length} customers with null tenantId`);

    // Test 3: Check if we can include tenant relation (should handle null)
    console.log('\n3. Testing customer query with tenant include...');
    const customersWithTenant = await prisma.customer.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5
    });
    console.log(`   ✅ Found ${customersWithTenant.length} customers with tenant include`);
    customersWithTenant.forEach(customer => {
      console.log(`   - ${customer.name}: tenantId=${customer.tenantId}, tenant=${customer.tenant?.name || 'null'}`);
    });

    // Cleanup
    console.log('\n4. Cleaning up test data...');
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    });
    console.log('   ✅ Test data cleaned up');

    console.log('\n✅ Schema update test passed!');
    console.log('   - Customer.tenantId is now nullable');
    console.log('   - Queries with null tenantId work');
    console.log('   - Tenant include handles null values');

  } catch (error) {
    console.error('❌ Schema update test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSchemaUpdate();
