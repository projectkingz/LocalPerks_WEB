import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a random UK mobile number
 * Format: 07XXX XXXXXX or 07XXXXXXXXX
 */
function generateMobileNumber(): string {
  // UK mobile number prefixes
  const prefixes = ['7700', '7711', '7722', '7733', '7744', '7755', '7766', '7777', '7788', '7799'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // Generate 6 random digits
  const suffix = Math.floor(100000 + Math.random() * 900000);
  
  // Return in format: 07XXX XXXXXX
  return `07${prefix} ${suffix}`;
}

/**
 * Normalize mobile number to consistent format (removes spaces, ensures +44 format)
 */
function normalizeMobile(mobile: string): string {
  // Remove all spaces and special characters except +
  let cleaned = mobile.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +44
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.substring(1);
  }
  
  // If doesn't start with +, add +44
  if (!cleaned.startsWith('+')) {
    cleaned = '+44' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate mobile numbers for existing tenants and admins that don't have them
 */
async function generateMobileNumbers() {
  console.log('🔄 Starting mobile number generation for existing users...\n');

  try {
    // 1. Find tenants without mobile numbers
    const tenantsWithoutMobile = await prisma.tenant.findMany({
      where: {
        OR: [
          { mobile: null },
          { mobile: '' }
        ]
      },
      include: {
        partnerUser: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${tenantsWithoutMobile.length} tenants without mobile numbers`);

    let tenantUpdateCount = 0;
    for (const tenant of tenantsWithoutMobile) {
      const mobileNumber = generateMobileNumber();
      const normalizedMobile = normalizeMobile(mobileNumber);
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { mobile: normalizedMobile }
      });

      tenantUpdateCount++;
      console.log(`  ✅ Generated mobile for tenant "${tenant.name}" (${tenant.partnerUser?.email}): ${normalizedMobile}`);
    }

    console.log(`\n✅ Updated ${tenantUpdateCount} tenants with mobile numbers\n`);

    // 2. Find admins without mobile numbers
    const adminsWithoutMobile = await prisma.admin.findMany({
      where: {
        OR: [
          { mobile: null },
          { mobile: '' }
        ]
      },
      include: {
        adminUser: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${adminsWithoutMobile.length} admins without mobile numbers`);

    let adminUpdateCount = 0;
    for (const admin of adminsWithoutMobile) {
      const mobileNumber = generateMobileNumber();
      const normalizedMobile = normalizeMobile(mobileNumber);
      
      await prisma.admin.update({
        where: { id: admin.id },
        data: { mobile: normalizedMobile }
      });

      adminUpdateCount++;
      console.log(`  ✅ Generated mobile for admin "${admin.name}" (${admin.adminUser?.email}): ${normalizedMobile}`);
    }

    console.log(`\n✅ Updated ${adminUpdateCount} admins with mobile numbers\n`);

    // Note: Customers already have mobile as required field in schema, so no need to check
    console.log('ℹ️  Customers already have mobile as required field - skipping customer check\n');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tenants updated: ${tenantUpdateCount}`);
    console.log(`Admins updated: ${adminUpdateCount}`);
    console.log(`Customers updated: ${customersWithoutMobile.length > 0 ? customersWithoutMobile.length : 0}`);
    console.log(`Total updated: ${tenantUpdateCount + adminUpdateCount + (customersWithoutMobile.length > 0 ? customersWithoutMobile.length : 0)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Mobile number generation completed successfully!');

  } catch (error) {
    console.error('❌ Error generating mobile numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateMobileNumbers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

