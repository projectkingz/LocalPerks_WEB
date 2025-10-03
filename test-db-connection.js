const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try to query the database
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in the database`);
    
    // Check if we have any tenants
    const tenantCount = await prisma.tenant.count();
    console.log(`🏢 Found ${tenantCount} tenants in the database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Make sure your database is running');
    console.log('2. Update the DATABASE_URL in your .env file');
    console.log('3. Run: npx prisma migrate dev');
    console.log('4. Run: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 