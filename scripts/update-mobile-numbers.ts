// Script to update all mobile numbers to +447402611112
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
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

async function updateAllMobileNumbers() {
  const testMobile = '07402 611112';
  const normalizedMobile = normalizePhoneNumber(testMobile);
  
  console.log('\n🔧 Updating all mobile numbers...\n');
  console.log(`Target: ${testMobile}`);
  console.log(`Normalized: ${normalizedMobile}\n`);

  try {
    // Test connection first
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connected!\n');

    // Update all Customer mobile numbers
    console.log('📱 Updating Customer mobile numbers...');
    const customerResult = await prisma.customer.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`   ✅ Updated ${customerResult.count} customers`);

    // Update all Tenant (Partner) mobile numbers
    console.log('📱 Updating Tenant mobile numbers...');
    const tenantResult = await prisma.tenant.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`   ✅ Updated ${tenantResult.count} tenants`);

    // Update Admin mobile numbers
    console.log('📱 Updating Admin mobile numbers...');
    const adminResult = await prisma.admin.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`   ✅ Updated ${adminResult.count} admins`);

    // Verify the updates
    console.log('\n📊 Verifying updates...');
    const customerCount = await prisma.customer.count({
      where: { mobile: normalizedMobile },
    });
    const tenantCount = await prisma.tenant.count({
      where: { mobile: normalizedMobile },
    });
    const adminCount = await prisma.admin.count({
      where: { mobile: normalizedMobile },
    });

    const totalCustomers = await prisma.customer.count();
    const totalTenants = await prisma.tenant.count();
    const totalAdmins = await prisma.admin.count();

    console.log('\n✅ Update Summary:');
    console.log(`   Customers: ${customerCount}/${totalCustomers} updated`);
    console.log(`   Tenants: ${tenantCount}/${totalTenants} updated`);
    console.log(`   Admins: ${adminCount}/${totalAdmins} updated`);
    console.log(`\n✅ All mobile numbers updated to: ${normalizedMobile}\n`);

  } catch (error: any) {
    console.error('\n❌ Error updating mobile numbers:', error.message);
    
    if (error.message?.includes('API key') || error.message?.includes('datasource')) {
      console.error('\n⚠️  Database connection issue detected.');
      console.error('💡 Try using the SQL script instead:');
      console.error('   See: scripts/update-all-mobile-numbers.sql');
      console.error('\n   Or run this SQL directly in your database:');
      console.error('   UPDATE Customer SET mobile = \'+447402611112\' WHERE mobile IS NOT NULL;');
      console.error('   UPDATE Tenant SET mobile = \'+447402611112\' WHERE mobile IS NOT NULL;');
      console.error('   UPDATE Admin SET mobile = \'+447402611112\' WHERE mobile IS NOT NULL;');
    } else {
      console.error('\n💡 Make sure:');
      console.error('   - Database is running');
      console.error('   - Connection string is correct in .env or .env.local');
      console.error('   - You have write permissions');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAllMobileNumbers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed');
    process.exit(1);
  });






