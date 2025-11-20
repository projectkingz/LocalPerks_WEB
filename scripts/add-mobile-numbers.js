const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate random UK mobile number
function generateUKMobile() {
  // UK mobile numbers: 07XXX XXXXXX
  const prefixes = ['07401', '07402', '07403', '07404', '07405', '07500', '07501', '07502', '07700', '07800', '07900'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${suffix}`;
}

async function addMobileNumbers() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ADDING MOBILE NUMBERS                                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    // 1. Add mobile numbers to all Tenant accounts
    console.log('📱 Adding mobile numbers to Tenant accounts...\n');
    
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { mobile: null },
          { mobile: '' }
        ]
      },
      select: { id: true, name: true, mobile: true }
    });

    console.log(`   Found ${tenants.length} tenants without mobile numbers\n`);

    for (const tenant of tenants) {
      const mobile = generateUKMobile();
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { mobile }
      });
      console.log(`   ✅ ${tenant.name}: ${mobile}`);
    }

    // 2. Create Admin profiles for admin users and add mobile numbers
    console.log('\n📱 Creating Admin profiles and adding mobile numbers...\n');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminProfile: {
          select: { id: true, mobile: true }
        }
      }
    });

    console.log(`   Found ${adminUsers.length} admin users\n`);

    for (const user of adminUsers) {
      if (!user.adminProfile) {
        // Create admin profile
        const mobile = generateUKMobile();
        await prisma.admin.create({
          data: {
            name: user.name || 'Admin User',
            mobile,
            adminUserId: user.id,
          }
        });
        console.log(`   ✅ Created profile for ${user.name} (${user.email}): ${mobile}`);
      } else if (!user.adminProfile.mobile) {
        // Update existing profile with mobile
        const mobile = generateUKMobile();
        await prisma.admin.update({
          where: { adminUserId: user.id },
          data: { mobile }
        });
        console.log(`   ✅ Updated profile for ${user.name} (${user.email}): ${mobile}`);
      } else {
        console.log(`   ⏭️  Skipped ${user.name} (${user.email}) - already has mobile`);
      }
    }

    console.log('\n✅ All mobile numbers added successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMobileNumbers();







