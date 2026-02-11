// Script to update all user mobile numbers to a test number
import { PrismaClient } from '@prisma/client';
import { normalizePhoneNumber } from '../src/lib/auth/two-factor';

const prisma = new PrismaClient();

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

    // Verify the updates
    const customerCount = await prisma.customer.count({
      where: { mobile: normalizedMobile },
    });
    const tenantCount = await prisma.tenant.count({
      where: { mobile: normalizedMobile },
    });

    console.log('\n📊 Verification:');
    console.log(`   Customers with updated mobile: ${customerCount}`);
    console.log(`   Tenants with updated mobile: ${tenantCount}`);
    console.log(`\n✅ All mobile numbers updated to: ${normalizedMobile}\n`);

  } catch (error) {
    console.error('❌ Error updating mobile numbers:', error);
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






