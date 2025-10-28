/**
 * Create System Discount Rewards (£1 - £20)
 * 
 * This script creates 20 system-level discount rewards that can be redeemed
 * as vouchers by customers. These are special rewards that work across all tenants.
 * 
 * Usage: node scripts/create-discount-rewards.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDiscountRewards() {
  console.log('🎟️  Creating system discount rewards...\n');

  try {
    // First, we need a system tenant for these rewards
    // Check if system tenant exists
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'LocalPerks System' }
    });

    if (!systemTenant) {
      // Need to find or create a system user first
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@localperks.com' }
      });

      if (!systemUser) {
        console.log('📝 Creating system user...');
        systemUser = await prisma.user.create({
          data: {
            email: 'system@localperks.com',
            name: 'LocalPerks System',
            role: 'ADMIN',
            password: 'N/A' // System account, no login
          }
        });
        console.log('✅ System user created\n');
      }

      console.log('📝 Creating system tenant...');
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'LocalPerks System',
          partnerUserId: systemUser.id,
          mobile: 'N/A'
        }
      });
      console.log('✅ System tenant created\n');
    } else {
      console.log('✅ System tenant already exists\n');
    }

    console.log('🎯 Creating discount rewards (£1 - £20)...\n');

    let created = 0;
    let skipped = 0;

    for (let i = 1; i <= 20; i++) {
      const discountAmount = i;
      const requiredPoints = discountAmount * 100; // £1 = 100 points at £0.01 per point
      const rewardName = `£${discountAmount} Discount Voucher`;
      
      // Check if this discount reward already exists
      const existing = await prisma.reward.findFirst({
        where: {
          name: rewardName,
          tenantId: systemTenant.id
        }
      });

      if (existing) {
        console.log(`   ⏭️  £${discountAmount} discount already exists (${existing.id.substring(0, 10)}...)`);
        skipped++;
        continue;
      }

      // Create the discount reward
      const reward = await prisma.reward.create({
        data: {
          name: rewardName,
          description: `Redeemable £${discountAmount} discount voucher. Can be used at any participating LocalPerks partner.`,
          points: requiredPoints,
          tenantId: systemTenant.id,
        }
      });

      console.log(`   ✅ Created £${discountAmount} discount (${requiredPoints} pts) - ${reward.id.substring(0, 10)}...`);
      created++;
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Discount Rewards Creation Complete!');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped (already exist): ${skipped}`);
    console.log(`   📊 Total: ${created + skipped}/20`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Display the created rewards
    const allDiscountRewards = await prisma.reward.findMany({
      where: {
        name: { contains: 'Discount Voucher' },
        tenantId: systemTenant.id
      },
      orderBy: { points: 'asc' }
    });

    console.log('📋 All Discount Rewards:');
    allDiscountRewards.forEach(r => {
      console.log(`   🎟️  ${r.name} | ${r.points} points | ID: ${r.id.substring(0, 10)}...`);
    });

    console.log('\n✅ System discount rewards are ready!\n');

  } catch (error) {
    console.error('\n❌ Failed to create discount rewards:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDiscountRewards()
  .then(() => {
    console.log('👍 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });







