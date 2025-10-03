const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing PlanetScale MySQL connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Count records
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    const rewardCount = await prisma.reward.count();
    const customerCount = await prisma.customer.count();
    
    console.log('\n📊 Database Statistics:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Tenants: ${tenantCount}`);
    console.log(`🎁 Rewards: ${rewardCount}`);
    console.log(`👤 Customers: ${customerCount}`);
    
    // Test a simple query
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true, role: true }
    });
    
    console.log('\n👨‍💼 Admin Users:');
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ${user.role}`);
    });
    
    console.log('\n🎉 Database is working perfectly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
