// Test database connection locally
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  
  // Check environment variables
  console.log('1. Checking Environment Variables:');
  const dbUrl = process.env.DATABASE_URL;
  const accelEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  console.log(`   DATABASE_URL exists: ${!!dbUrl}`);
  if (dbUrl) {
    const preview = dbUrl.substring(0, 30) + '...';
    console.log(`   DATABASE_URL format: ${preview}`);
    if (dbUrl.startsWith('prisma://')) {
      console.log('   ✅ Using Prisma Accelerate protocol (correct)');
    } else if (dbUrl.startsWith('prisma+mysql://')) {
      console.log('   ❌ DATABASE_URL uses prisma+mysql:// (WRONG!)');
      console.log('   ❌ DATABASE_URL should be: prisma://... (not prisma+mysql://)');
      console.log('   ❌ PRISMA_ACCELERATE_ENDPOINT should be: prisma+mysql://...');
      console.log('   💡 Fix: Change DATABASE_URL in Vercel from prisma+mysql:// to prisma://');
    } else if (dbUrl.startsWith('mysql://')) {
      console.log('   ✅ Using direct MySQL connection');
    } else {
      console.log('   ⚠️  Unknown protocol');
    }
  }
  
  console.log(`   PRISMA_ACCELERATE_ENDPOINT exists: ${!!accelEndpoint}`);
  if (accelEndpoint) {
    const preview = accelEndpoint.substring(0, 40) + '...';
    console.log(`   PRISMA_ACCELERATE_ENDPOINT format: ${preview}`);
    if (accelEndpoint.startsWith('prisma+mysql://')) {
      console.log('   ✅ Correct format (prisma+mysql://)');
    } else if (accelEndpoint.startsWith('prisma://')) {
      console.log('   ⚠️  Using prisma:// (should be prisma+mysql://)');
    } else if (accelEndpoint.startsWith('https://')) {
      console.log('   ❌ WRONG FORMAT! Should be prisma+mysql:// not https://');
    } else {
      console.log('   ⚠️  Unknown format');
    }
  }
  
  // Check if using Accelerate
  // DATABASE_URL should be prisma:// (not prisma+mysql://)
  // PRISMA_ACCELERATE_ENDPOINT should be prisma+mysql://
  const isUsingAccelerate = dbUrl?.startsWith('prisma://') || dbUrl?.startsWith('prisma+mysql://');
  
  // Warn if DATABASE_URL has wrong format
  if (dbUrl?.startsWith('prisma+mysql://')) {
    console.log('\n❌ ERROR: DATABASE_URL has wrong format!');
    console.log('   Current: prisma+mysql://...');
    console.log('   Should be: prisma://...');
    console.log('   Fix: Update DATABASE_URL in Vercel environment variables');
    console.log('   Change prisma+mysql:// to prisma:// (keep same API key)');
  }
  
  if (isUsingAccelerate && !accelEndpoint) {
    console.log('\n❌ ERROR: DATABASE_URL uses prisma:// but PRISMA_ACCELERATE_ENDPOINT is not set!');
    console.log('   Please set PRISMA_ACCELERATE_ENDPOINT in your .env file');
    process.exit(1);
  }
  
  if (isUsingAccelerate && accelEndpoint && !accelEndpoint.startsWith('prisma+mysql://') && !accelEndpoint.startsWith('prisma://')) {
    console.log('\n❌ ERROR: PRISMA_ACCELERATE_ENDPOINT has wrong format!');
    console.log(`   Current: ${accelEndpoint.substring(0, 30)}...`);
    console.log('   Should be: prisma+mysql://accelerate.prisma-data.net/?api_key=...');
    process.exit(1);
  }
  
  console.log('\n2. Creating Prisma Client...');
  let prisma;
  
  try {
    if (isUsingAccelerate && accelEndpoint) {
      console.log('   Using Accelerate extension...');
      prisma = new PrismaClient().$extends(withAccelerate());
    } else {
      console.log('   Using direct connection...');
      prisma = new PrismaClient();
    }
    console.log('   ✅ Prisma Client created');
  } catch (error) {
    console.log('   ❌ Error creating Prisma Client:', error.message);
    process.exit(1);
  }
  
  console.log('\n3. Testing Database Query...');
  try {
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query successful!');
    console.log('   Result:', result);
    
    // Try to get user count
    const userCount = await prisma.user.count();
    console.log(`   ✅ Database connected! Found ${userCount} users`);
    
    console.log('\n✅ SUCCESS: Database connection working!\n');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.log('   ❌ Query failed:', error.message);
    console.log('\n   Error details:');
    console.log('   Name:', error.name);
    if (error.code) {
      console.log('   Code:', error.code);
    }
    if (error.meta) {
      console.log('   Meta:', JSON.stringify(error.meta, null, 2));
    }
    
    console.log('\n❌ FAILED: Could not connect to database\n');
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection().catch(console.error);

