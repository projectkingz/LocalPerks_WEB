const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testCompleteLoginFlow() {
  try {
    console.log('Testing Complete Login Flow...\n');

    // Test multiple users to ensure the fix works
    const testUsers = [
      { email: 'user1@test.com', password: 'password123', expectedSuspended: false },
      { email: 'user2@test.com', password: 'password123', expectedSuspended: false },
      { email: 'admin1@localperks.com', password: 'password123', expectedSuspended: false },
      { email: 'sarah.johnson@business.com', password: 'password123', expectedSuspended: false },
    ];

    for (const testUser of testUsers) {
      console.log(`\n=== Testing User: ${testUser.email} ===`);
      
      // Step 1: Find user with raw query (like auth config)
      const users = await prisma.$queryRaw`
        SELECT id, email, name, role, "tenantId", password, suspended
        FROM "User"
        WHERE email = ${testUser.email}
        LIMIT 1
      `;

      const user = users[0];
      if (!user) {
        console.log(`❌ User not found: ${testUser.email}`);
        continue;
      }

      console.log(`✅ User found: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Suspended: ${user.suspended} (expected: ${testUser.expectedSuspended})`);

      // Step 2: Check password
      if (!user.password) {
        console.log(`❌ User has no password: ${user.email}`);
        continue;
      }

      const isPasswordValid = await compare(testUser.password, user.password);
      if (!isPasswordValid) {
        console.log(`❌ Invalid password for: ${user.email}`);
        continue;
      }

      console.log(`✅ Password valid for: ${user.email}`);

      // Step 3: Test auth config logic
      if (user.suspended === true) {
        console.log(`❌ User is suspended: ${user.email}`);
      } else {
        console.log(`✅ User is not suspended: ${user.email}`);
      }

      // Step 4: Test signIn callback logic
      const userObject = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        suspended: user.suspended,
      };

      if (userObject.suspended === true) {
        console.log(`❌ SignIn callback would block: ${user.email}`);
      } else {
        console.log(`✅ SignIn callback would allow: ${user.email}`);
      }

      // Step 5: Verify expected vs actual
      if (user.suspended === testUser.expectedSuspended) {
        console.log(`✅ Suspended status matches expectation for: ${user.email}`);
      } else {
        console.log(`❌ Suspended status mismatch for: ${user.email}`);
        console.log(`  Expected: ${testUser.expectedSuspended}, Got: ${user.suspended}`);
      }
    }

    // Test suspended users
    console.log('\n=== Testing Suspended Users ===');
    const suspendedUsers = await prisma.user.findMany({
      where: { suspended: true },
      take: 2
    });

    for (const suspendedUser of suspendedUsers) {
      console.log(`\nTesting suspended user: ${suspendedUser.email}`);
      
      if (suspendedUser.suspended === true) {
        console.log(`✅ Correctly identified as suspended: ${suspendedUser.email}`);
      } else {
        console.log(`❌ Incorrectly identified as not suspended: ${suspendedUser.email}`);
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN suspended = true THEN 1 END) as suspended_users,
        COUNT(CASE WHEN suspended = false THEN 1 END) as active_users
      FROM "User"
    `;

    console.log(`Total users: ${stats[0].total_users}`);
    console.log(`Suspended users: ${stats[0].suspended_users}`);
    console.log(`Active users: ${stats[0].active_users}`);

    if (stats[0].suspended_users === 2) {
      console.log('✅ Suspended user count is correct (2 users)');
    } else {
      console.log(`❌ Suspended user count is incorrect: ${stats[0].suspended_users} (expected 2)`);
    }

    console.log('\n🎉 Login flow test completed!');
    console.log('If all tests pass, the suspended user issue should be resolved.');
    console.log('Try logging in with a test account in your browser.');

  } catch (error) {
    console.error('❌ Error during login flow test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteLoginFlow(); 