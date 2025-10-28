/**
 * Create Missing Discount Vouchers
 * 
 * This script finds discount redemption transactions that don't have
 * corresponding voucher records and creates them retroactively.
 * 
 * Usage: node scripts/create-missing-discount-vouchers.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DISK-'; // Discount voucher prefix
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

async function generateUniqueVoucherCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateVoucherCode();
    const existing = await prisma.voucher.findUnique({
      where: { code }
    });
    
    if (!existing) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique voucher code');
}

async function createMissingVouchers() {
  console.log('🔍 Finding discount redemption transactions without vouchers...\n');

  try {
    // Get system tenant
    const systemTenant = await prisma.tenant.findFirst({
      where: { name: 'LocalPerks System' }
    });

    if (!systemTenant) {
      console.log('❌ System tenant not found. Please run create-discount-rewards.js first.');
      return;
    }

    console.log('✅ System tenant found:', systemTenant.id, '\n');

    // Get all system discount rewards
    const discountRewards = await prisma.reward.findMany({
      where: {
        name: { contains: 'Discount Voucher' },
        tenantId: systemTenant.id
      }
    });

    console.log(`✅ Found ${discountRewards.length} discount rewards\n`);

    // Create a map of points to reward IDs
    const pointsToRewardMap = {};
    discountRewards.forEach(r => {
      pointsToRewardMap[r.points] = r;
    });

    // Find SPENT transactions that look like discount redemptions
    // (amounts between £1-£20 in whole pounds or with face value)
    const potentialDiscountTransactions = await prisma.transaction.findMany({
      where: {
        type: 'SPENT',
        amount: { gt: 0, lte: 20 },
        status: 'APPROVED'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${potentialDiscountTransactions.length} potential discount transactions\n`);

    let created = 0;
    let skipped = 0;

    for (const transaction of potentialDiscountTransactions) {
      // Check if a voucher already exists for this transaction
      const existingVoucher = await prisma.voucher.findFirst({
        where: {
          customerId: transaction.customerId,
          // Check if voucher created within 1 minute of transaction
          createdAt: {
            gte: new Date(transaction.createdAt.getTime() - 60000),
            lte: new Date(transaction.createdAt.getTime() + 60000)
          }
        }
      });

      if (existingVoucher) {
        console.log(`   ⏭️  Skipped: Transaction ${transaction.id.substring(0, 8)}... already has voucher`);
        skipped++;
        continue;
      }

      // Find matching discount reward by points
      const matchingReward = pointsToRewardMap[transaction.points];
      
      if (!matchingReward) {
        console.log(`   ⚠️  No matching reward for ${transaction.points} points (transaction ${transaction.id.substring(0, 8)}...)`);
        skipped++;
        continue;
      }

      try {
        // Create redemption record
        const redemption = await prisma.redemption.create({
          data: {
            rewardId: matchingReward.id,
            customerId: transaction.customerId,
            points: transaction.points,
            createdAt: transaction.createdAt, // Backdate to match transaction
          }
        });

        // Generate unique voucher code
        const voucherCode = await generateUniqueVoucherCode();
        
        // Set expiration date to 1 year from creation
        const expiresAt = new Date(transaction.createdAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Create the voucher
        const voucher = await prisma.voucher.create({
          data: {
            code: voucherCode,
            redemptionId: redemption.id,
            customerId: transaction.customerId,
            rewardId: matchingReward.id,
            status: 'active',
            expiresAt,
            createdAt: transaction.createdAt, // Backdate to match transaction
          }
        });

        console.log(`   ✅ Created voucher for ${transaction.customer.name}`);
        console.log(`      £${transaction.amount.toFixed(2)} | ${transaction.points} pts | Code: ${voucherCode}`);
        console.log(`      Reward: ${matchingReward.name}`);
        console.log('');
        created++;
      } catch (error) {
        console.error(`   ❌ Failed to create voucher for transaction ${transaction.id}:`, error.message);
      }
    }

    console.log('='.repeat(80));
    console.log(`\n✨ Voucher Creation Complete!`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total processed: ${potentialDiscountTransactions.length}`);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMissingVouchers();







