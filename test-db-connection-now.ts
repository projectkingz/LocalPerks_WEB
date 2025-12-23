import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.log('\n💡 Make sure you have a .env.local file with:');
    console.log('   DATABASE_URL="mysql://..."');
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log('📡 Connection String:', maskedUrl);
  console.log('');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('⏳ Connecting to database...');
    
    // Test 1: Basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database!\n');

    // Test 2: Query database version/info
    console.log('📊 Testing database query...');
    const result = await prisma.$queryRaw`SELECT VERSION() as version, DATABASE() as database_name`;
    console.log('✅ Database query successful!');
    console.log('   Database Info:', result);
    console.log('');

    // Test 3: Check if tables exist
    console.log('📋 Checking database tables...');
    const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`);
      tables.forEach((table, index) => {
        const tableName = table.TABLE_NAME || (table as any).table_name || 'unknown';
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('⚠️  No tables found in database');
      console.log('   You may need to run: npx prisma db push');
    }
    console.log('');

    // Test 4: Test a simple query on User table (if it exists)
    const tableNames = tables.map(t => (t.TABLE_NAME || (t as any).table_name || '').toLowerCase());
    const userTableExists = tableNames.includes('user');
    if (userTableExists) {
      console.log('👤 Testing User table query...');
      const userCount = await prisma.user.count();
      console.log(`✅ User table accessible - Found ${userCount} user(s)`);
    } else {
      console.log('ℹ️  User table not found (this is okay if schema not deployed yet)');
    }
    console.log('');

    console.log('🎉 All database connection tests passed!');
    console.log('');
    console.log('✅ Your database is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    
    if (error instanceof Error) {
      console.error('Error details:');
      console.error('  Name:', error.name);
      console.error('  Message:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error('\n💡 This looks like a DNS/network issue.');
        console.error('   - Check your internet connection');
        console.error('   - Verify the database host is correct');
      } else if (error.message.includes('Access denied')) {
        console.error('\n💡 Authentication failed.');
        console.error('   - Check your username and password');
        console.error('   - Verify credentials in PlanetScale dashboard');
      } else if (error.message.includes('SSL')) {
        console.error('\n💡 SSL connection issue.');
        console.error('   - Make sure your connection string includes ?sslaccept=strict');
      } else if (error.message.includes('Unknown database')) {
        console.error('\n💡 Database not found.');
        console.error('   - Verify the database name is correct');
        console.error('   - Check PlanetScale dashboard for database name');
      }
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testDatabaseConnection()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

