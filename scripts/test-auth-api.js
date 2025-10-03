const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthAPI() {
  try {
    console.log('Testing Auth API and suspended field handling...\n');

    // Test 1: Check if there are any users with null suspended field
    console.log('1. Checking for users with null suspended field...');
    const usersWithNullSuspended = await prisma.$queryRaw`
      SELECT id, email, suspended, "suspended" IS NULL as is_null
      FROM "User"
      WHERE "suspended" IS NULL
      LIMIT 5
    `;

    if (usersWithNullSuspended.length > 0) {
      console.log('⚠️  Found users with null suspended field:');
      usersWithNullSuspended.forEach(user => {
        console.log(`- ${user.email}: suspended=${user.suspended}, is_null=${user.is_null}`);
      });
    } else {
      console.log('✅ No users with null suspended field found');
    }

    // Test 2: Check if there are any users with undefined suspended field
    console.log('\n2. Checking for users with undefined suspended field...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        suspended: true
      },
      take: 5
    });

    console.log('Sample users:');
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}: suspended=${user.suspended} (${typeof user.suspended})`);
    });

    // Test 3: Check if the suspended field is properly indexed
    console.log('\n3. Checking suspended field statistics...');
    const suspendedStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN suspended = true THEN 1 END) as suspended_users,
        COUNT(CASE WHEN suspended = false THEN 1 END) as active_users,
        COUNT(CASE WHEN suspended IS NULL THEN 1 END) as null_suspended
      FROM "User"
    `;

    console.log('Suspended field statistics:');
    console.log(`- Total users: ${suspendedStats[0].total_users}`);
    console.log(`- Suspended users: ${suspendedStats[0].suspended_users}`);
    console.log(`- Active users: ${suspendedStats[0].active_users}`);
    console.log(`- Null suspended: ${suspendedStats[0].null_suspended}`);

    // Test 4: Check if there's an issue with the auth config logic
    console.log('\n4. Testing auth config logic simulation...');
    const testUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        suspended: true
      },
      take: 3
    });

    testUsers.forEach((user, i) => {
      console.log(`\nUser ${i + 1}: ${user.email}`);
      console.log(`- suspended value: ${user.suspended}`);
      console.log(`- suspended type: ${typeof user.suspended}`);
      console.log(`- user.suspended === true: ${user.suspended === true}`);
      console.log(`- user.suspended === false: ${user.suspended === false}`);
      console.log(`- user.suspended == true: ${user.suspended == true}`);
      console.log(`- user.suspended == false: ${user.suspended == false}`);
      console.log(`- Boolean(user.suspended): ${Boolean(user.suspended)}`);
      
      // Simulate the auth config check
      if (user.suspended) {
        console.log(`- Auth result: ❌ SUSPENDED - would redirect to signin with error`);
      } else {
        console.log(`- Auth result: ✅ ACTIVE - login would proceed`);
      }
    });

    // Test 5: Check if there are any database connection issues
    console.log('\n5. Testing database connection...');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection working:', dbTest[0].test);

  } catch (error) {
    console.error('❌ Error during auth API test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthAPI(); 