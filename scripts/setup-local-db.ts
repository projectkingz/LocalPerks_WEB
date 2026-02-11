// Script to set up local database connection
// Run: npx tsx scripts/setup-local-db.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function setupLocalDatabase() {
  console.log('\n🔧 Setting up local database connection...\n');

  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');

  // Prompt for local database URL
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      readline.question(query, resolve);
    });
  };

  try {
    console.log('Please provide your local MySQL connection string:');
    console.log('Format: mysql://user:password@host:port/database');
    console.log('Example: mysql://root:password@localhost:3306/localperks\n');

    const dbUrl = await question('DATABASE_URL: ');

    if (!dbUrl || !dbUrl.startsWith('mysql://')) {
      console.error('❌ Invalid database URL. Must start with mysql://');
      process.exit(1);
    }

    // Create .env.local content
    const envLocalContent = `# Local Development Database
DATABASE_URL="${dbUrl}"

# No Accelerate needed for local
# PRISMA_ACCELERATE_ENDPOINT=

# Local environment
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Copy other variables from .env as needed
`;

    // Write .env.local
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log(`\n✅ Created ${envLocalPath}`);

    // Test connection
    console.log('\n🔍 Testing database connection...');
    process.env.DATABASE_URL = dbUrl;

    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');

    // Get database info
    const dbName = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT DATABASE() as database
    `;
    console.log(`📊 Connected to database: ${dbName[0]?.database || 'unknown'}`);

    console.log('\n✅ Local database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Run: npx prisma migrate dev (if needed)');
    console.log('   3. Run: npm run dev');
    console.log('\n💡 Use .env.local for local development');
    console.log('   Use .env.production or Vercel env vars for production\n');

  } catch (error: any) {
    console.error('\n❌ Error setting up local database:', error.message);
    if (error.message.includes('connect')) {
      console.error('\n💡 Make sure:');
      console.error('   - MySQL server is running');
      console.error('   - Database exists');
      console.error('   - Credentials are correct');
      console.error('   - Port is correct (default: 3306)\n');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    readline.close();
  }
}

setupLocalDatabase();






