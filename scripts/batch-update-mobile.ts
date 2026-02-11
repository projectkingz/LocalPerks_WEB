// Batch update mobile numbers from CSV or interactive input
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load .env.local first (for local development), then .env (fallback)
// .env.local takes precedence over .env
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('📁 Loading .env.local for local development...\n');
  dotenv.config({ path: envLocalPath, override: true });
} else if (fs.existsSync(envPath)) {
  console.log('📁 Loading .env...\n');
  dotenv.config({ path: envPath });
} else {
  console.error('❌ No .env or .env.local file found!');
  process.exit(1);
}

// Create Prisma Client - check if using direct MySQL or Accelerate
const dbUrl = process.env.DATABASE_URL || '';
const isUsingAccelerate = dbUrl.startsWith('prisma://');

if (isUsingAccelerate) {
  console.error('\n❌ Error: DATABASE_URL uses Prisma Accelerate (prisma://)');
  console.error('💡 For local development, use .env.local with direct MySQL connection.');
  console.error('\n📋 Your .env.local should have:');
  console.error('   DATABASE_URL="mysql://user:password@localhost:3306/localperks"');
  console.error('\n   NOT: DATABASE_URL="prisma://..."');
  console.error('\n💡 Or use SQL directly:');
  console.error('   npx prisma studio');
  process.exit(1);
}

console.log(`✅ Using database: ${dbUrl.substring(0, 30)}...\n`);

const prisma = new PrismaClient({
  log: ['error'],
});

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 0, assume it's a UK number (remove leading 0 and add +44)
  if (normalized.startsWith('0')) {
    normalized = '+44' + normalized.substring(1);
  }
  // If it doesn't start with +, add +44 (UK default)
  else if (!normalized.startsWith('+')) {
    normalized = '+44' + normalized;
  }
  
  return normalized;
}

interface UpdateRecord {
  type: 'customer' | 'tenant' | 'admin';
  id: string;
  email?: string;
  name?: string;
  currentMobile?: string;
  newMobile: string;
}

async function readCSV(filePath: string): Promise<UpdateRecord[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const records: UpdateRecord[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV format: type,id,email,name,newMobile
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    
    if (parts.length >= 3) {
      const type = parts[0].toLowerCase() as 'customer' | 'tenant' | 'admin';
      const id = parts[1];
      const newMobile = normalizePhoneNumber(parts[parts.length - 1]); // Last column is mobile

      records.push({
        type,
        id,
        email: parts[2] || undefined,
        name: parts[3] || undefined,
        newMobile,
      });
    }
  }

  return records;
}

async function updateFromCSV(csvPath: string) {
  console.log(`\n📄 Reading CSV file: ${csvPath}\n`);
  
  const records = await readCSV(csvPath);
  console.log(`📊 Found ${records.length} records to update\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      if (record.type === 'customer') {
        const customer = await prisma.customer.findUnique({
          where: { id: record.id },
        });

        if (!customer) {
          console.log(`⚠️  Customer ${record.id} not found`);
          errorCount++;
          continue;
        }

        await prisma.customer.update({
          where: { id: record.id },
          data: { mobile: record.newMobile },
        });
        console.log(`✅ Customer ${customer.email}: ${customer.mobile} → ${record.newMobile}`);
        successCount++;

      } else if (record.type === 'tenant') {
        const tenant = await prisma.tenant.findUnique({
          where: { id: record.id },
        });

        if (!tenant) {
          console.log(`⚠️  Tenant ${record.id} not found`);
          errorCount++;
          continue;
        }

        await prisma.tenant.update({
          where: { id: record.id },
          data: { mobile: record.newMobile },
        });
        console.log(`✅ Tenant ${tenant.name}: ${tenant.mobile} → ${record.newMobile}`);
        successCount++;

      } else if (record.type === 'admin') {
        const admin = await prisma.admin.findUnique({
          where: { id: record.id },
        });

        if (!admin) {
          console.log(`⚠️  Admin ${record.id} not found`);
          errorCount++;
          continue;
        }

        await prisma.admin.update({
          where: { id: record.id },
          data: { mobile: record.newMobile },
        });
        console.log(`✅ Admin ${admin.name}: ${admin.mobile} → ${record.newMobile}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`❌ Error updating ${record.type} ${record.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} updated, ${errorCount} errors\n`);
}

async function updateAllToSame(mobile: string) {
  const normalizedMobile = normalizePhoneNumber(mobile);
  
  console.log(`\n🔧 Updating ALL mobile numbers to: ${normalizedMobile}\n`);

  try {
    const customerResult = await prisma.customer.updateMany({
      data: { mobile: normalizedMobile },
    });
    console.log(`✅ Updated ${customerResult.count} customers`);

    const tenantResult = await prisma.tenant.updateMany({
      data: { mobile: normalizedMobile },
    });
    console.log(`✅ Updated ${tenantResult.count} tenants`);

    const adminResult = await prisma.admin.updateMany({
      data: { mobile: normalizedMobile },
    });
    console.log(`✅ Updated ${adminResult.count} admins`);

    console.log(`\n✅ All mobile numbers updated to: ${normalizedMobile}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function interactiveUpdate() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log('\n📱 Interactive Mobile Number Batch Update\n');
    console.log('Options:');
    console.log('  1. Update all to same number');
    console.log('  2. Update from CSV file');
    console.log('  3. View current mobile numbers\n');

    const choice = await question('Select option (1-3): ');

    if (choice === '1') {
      const mobile = await question('\nEnter mobile number (e.g., 07402 611112): ');
      await updateAllToSame(mobile);
    } else if (choice === '2') {
      const csvPath = await question('\nEnter CSV file path: ');
      if (fs.existsSync(csvPath)) {
        await updateFromCSV(csvPath);
      } else {
        console.error('❌ File not found:', csvPath);
      }
    } else if (choice === '3') {
      console.log('\n📊 Current Mobile Numbers:\n');
      
      const customers = await prisma.customer.findMany({
        select: { id: true, email: true, mobile: true },
        take: 10,
      });
      console.log('Customers (first 10):');
      customers.forEach(c => {
        console.log(`  ${c.email}: ${c.mobile || '(empty)'}`);
      });

      const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, mobile: true },
        take: 10,
      });
      console.log('\nTenants (first 10):');
      tenants.forEach(t => {
        console.log(`  ${t.name}: ${t.mobile || '(empty)'}`);
      });

      const admins = await prisma.admin.findMany({
        select: { id: true, name: true, mobile: true },
      });
      console.log('\nAdmins:');
      admins.forEach(a => {
        console.log(`  ${a.name}: ${a.mobile || '(empty)'}`);
      });
      console.log('');
    } else {
      console.log('❌ Invalid option');
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);

  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');

    if (args.length === 0) {
      // Interactive mode
      await interactiveUpdate();
    } else if (args[0] === '--all' && args[1]) {
      // Update all to same number
      await updateAllToSame(args[1]);
    } else if (args[0] === '--csv' && args[1]) {
      // Update from CSV
      await updateFromCSV(args[1]);
    } else {
      console.log('Usage:');
      console.log('  npx tsx scripts/batch-update-mobile.ts                    # Interactive mode');
      console.log('  npx tsx scripts/batch-update-mobile.ts --all "07402 611112"  # Update all to same');
      console.log('  npx tsx scripts/batch-update-mobile.ts --csv data.csv        # Update from CSV');
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message?.includes('API key') || error.message?.includes('datasource')) {
      console.error('\n⚠️  Database connection issue.');
      console.error('💡 Make sure your .env or .env.local has correct DATABASE_URL');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

