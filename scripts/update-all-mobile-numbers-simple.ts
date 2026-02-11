// Script to update all user mobile numbers to a test number
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
  console.log(`Original: ${testMobile}`);
  console.log(`Normalized: ${normalizedMobile}\n`);

  try {
    // Update all Customer mobile numbers
    const customerResult = await prisma.customer.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`✅ Updated ${customerResult.count} customer mobile numbers`);

    // Update all Tenant (Partner) mobile numbers
    const tenantResult = await prisma.tenant.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`✅ Updated ${tenantResult.count} tenant mobile numbers`);

    // Update Admin mobile numbers if they exist
    const adminResult = await prisma.admin.updateMany({
      data: {
        mobile: normalizedMobile,
      },
    });
    console.log(`✅ Updated ${adminResult.count} admin mobile numbers`);

    // Verify the updates
    const customerCount = await prisma.customer.count({
      where: { mobile: normalizedMobile },
    });
    const tenantCount = await prisma.tenant.count({
      where: { mobile: normalizedMobile },
    });
    const adminCount = await prisma.admin.count({
      where: { mobile: normalizedMobile },
    });

    console.log('\n📊 Verification:');
    console.log(`   Customers with updated mobile: ${customerCount}`);
    console.log(`   Tenants with updated mobile: ${tenantCount}`);
    console.log(`   Admins with updated mobile: ${adminCount}`);
    console.log(`\n✅ All mobile numbers updated to: ${normalizedMobile}\n`);

  } catch (error: any) {
    console.error('❌ Error updating mobile numbers:', error);
    if (error.message?.includes('API key')) {
      console.error('\n⚠️  Database connection issue. Try using the SQL script instead.');
      console.error('   See: scripts/update-all-mobile-numbers.sql\n');
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
    console.error('❌ Script failed:', error);
    process.exit(1);
  });






