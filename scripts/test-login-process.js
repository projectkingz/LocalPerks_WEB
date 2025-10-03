const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginProcess() {
  try {
    console.log('Testing login process...\n');

    // Test with a known user
    const testEmail = 'user1@test.com';
    const testPassword = 'password123';

    console.log(`Testing login for: ${testEmail}`);

    // Step 1: Find user with raw query (like in auth config)
    console.log('\n1. Finding user with raw query...');
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

    // Step 3: Check suspended status
    console.log('\n3. Checking suspended status...');
    console.log(`Suspended value: ${user.suspended}`);
    console.log(`Suspended type: ${typeof user.suspended}`);
    console.log(`Suspended === true: ${user.suspended === true}`);
    console.log(`Suspended === false: ${user.suspended === false}`);
    console.log(`Suspended == true: ${user.suspended == true}`);
    console.log(`Suspended == false: ${user.suspended == false}`);

    // Step 4: Simulate auth config logic
    console.log('\n4. Simulating auth config logic...');
    if (user.suspended) {
      console.log('❌ User is suspended - would redirect to signin with error');
    } else {
      console.log('✅ User is not suspended - login would proceed');
    }

    // Step 5: Check with Prisma findUnique
    console.log('\n5. Checking with Prisma findUnique...');
    const prismaUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        role: true,
        suspended: true
      }
    });

    if (prismaUser) {
      console.log('Prisma user suspended:', prismaUser.suspended);
      console.log('Prisma user suspended type:', typeof prismaUser.suspended);
    }

    // Step 6: Check all users suspended status
    console.log('\n6. Checking all users suspended status...');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        suspended: true
      },
      take: 10
    });

    console.log('First 10 users suspended status:');
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}: ${u.suspended} (${typeof u.suspended})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginProcess(); 