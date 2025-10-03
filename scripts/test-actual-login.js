const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testActualLogin() {
  try {
    console.log('Testing actual login process...\n');

    // Test with a known user
    const testEmail = 'user1@test.com';
    const testPassword = 'password123';

    console.log(`Testing login for: ${testEmail}`);

    // Step 1: Find user with raw query (exactly like auth config)
    console.log('\n1. Finding user with raw query (like auth config)...');
    const users = await prisma.$queryRaw`
      SELECT id, email, name, role, "tenantId", password, suspended
      FROM "User"
      WHERE email = ${testEmail}
      LIMIT 1
    `;

    const user = users[0];
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      suspended: user.suspended,
      suspendedType: typeof user.suspended
    });

    // Step 2: Check password
    console.log('\n2. Verifying password...');
    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }

    const isPasswordValid = await compare(testPassword, user.password);
    console.log(`Password valid: ${isPasswordValid ? '✅' : '❌'}`);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }

    // Step 3: Simulate the exact auth config logic
    console.log('\n3. Simulating auth config logic...');
    console.log('User suspended status:', user.suspended, typeof user.suspended);
    
    // This is the exact check from auth config
    if (user.suspended === true) {
      console.log('❌ User is suspended - would redirect to signin with error');
      return;
    } else {
      console.log('✅ User is not suspended - login would proceed');
    }

    // Step 4: Simulate the user object that would be returned
    console.log('\n4. Simulating user object returned by authorize...');
    const userObject = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      suspended: user.suspended,
    };

    console.log('User object:', userObject);

    // Step 5: Simulate the signIn callback
    console.log('\n5. Simulating signIn callback...');
    console.log('SignIn callback - user suspended status:', userObject.suspended, typeof userObject.suspended);
    
    if (userObject.suspended === true) {
      console.log('❌ Suspended user attempting to sign in - would redirect to signin with error');
    } else {
      console.log('✅ User can sign in successfully');
    }

    // Step 6: Test with a suspended user
    console.log('\n6. Testing with a suspended user...');
    const suspendedUsers = await prisma.user.findMany({
      where: { suspended: true },
      take: 1
    });

    if (suspendedUsers.length > 0) {
      const suspendedUser = suspendedUsers[0];
      console.log(`Testing suspended user: ${suspendedUser.email}`);
      console.log('Suspended user suspended status:', suspendedUser.suspended, typeof suspendedUser.suspended);
      
      if (suspendedUser.suspended === true) {
        console.log('❌ Suspended user would be blocked from login');
      } else {
        console.log('✅ Suspended user would be allowed to login (this is wrong!)');
      }
    } else {
      console.log('No suspended users found to test with');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActualLogin(); 