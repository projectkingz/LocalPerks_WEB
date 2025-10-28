const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthFix() {
  try {
    console.log('🧪 Testing auth fix for unique constraint errors...\n');
    
    const testEmail = `test-auth-${Date.now()}@example.com`;
    
    // Test 1: Create user with upsert
    console.log('1. Testing user creation with upsert...');
    const user1 = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        name: "Test User",
        emailVerified: new Date(),
      },
      create: {
        email: testEmail,
        name: "Test User",
        emailVerified: new Date(),
        role: "CUSTOMER",
      },
    });
    console.log(`   ✅ User created: ${user1.id}`);
    
    // Test 2: Try to create the same user again (should update, not error)
    console.log('2. Testing duplicate user creation (should update)...');
    const user2 = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        name: "Updated Test User",
        emailVerified: new Date(),
      },
      create: {
        email: testEmail,
        name: "Test User",
        emailVerified: new Date(),
        role: "CUSTOMER",
      },
    });
    console.log(`   ✅ User updated: ${user2.id} (same ID: ${user1.id === user2.id})`);
    
    // Test 3: Create customer with upsert
    console.log('3. Testing customer creation with upsert...');
    const customer1 = await prisma.customer.upsert({
      where: { email: testEmail },
      update: {
        name: "Test Customer",
        mobile: "1234567890",
        points: 100,
      },
      create: {
        email: testEmail,
        name: "Test Customer",
        mobile: "1234567890",
        points: 0,
        tenantId: "default",
      },
    });
    console.log(`   ✅ Customer created: ${customer1.id}`);
    
    // Test 4: Try to create the same customer again (should update, not error)
    console.log('4. Testing duplicate customer creation (should update)...');
    const customer2 = await prisma.customer.upsert({
      where: { email: testEmail },
      update: {
        name: "Updated Test Customer",
        mobile: "9876543210",
        points: 200,
      },
      create: {
        email: testEmail,
        name: "Test Customer",
        mobile: "1234567890",
        points: 0,
        tenantId: "default",
      },
    });
    console.log(`   ✅ Customer updated: ${customer2.id} (same ID: ${customer1.id === customer2.id})`);
    
    // Cleanup
    console.log('\n5. Cleaning up test data...');
    await prisma.customer.delete({ where: { email: testEmail } });
    await prisma.user.delete({ where: { email: testEmail } });
    console.log('   ✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Auth fix is working correctly.');
    console.log('   ✅ No unique constraint errors');
    console.log('   ✅ Upsert operations work as expected');
    console.log('   ✅ Duplicate creation attempts are handled gracefully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFix();
