/**
 * Check a specific customer's vouchers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomerVouchers() {
  const customerEmail = 'tina.allen900@example.com'; // Tina Allen
  
  console.log(`🔍 Checking vouchers for: ${customerEmail}\n`);

  try {
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        tenantId: true,
      }
    });

    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log('✅ Customer found:');
    console.log(`   Name: ${customer.name}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Points: ${customer.points}`);
    console.log(`   Customer ID: ${customer.id}\n`);

    // Find all vouchers for this customer
    const vouchers = await prisma.voucher.findMany({
      where: { customerId: customer.id },
      include: {
        reward: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        redemption: {
          select: {
            id: true,
            points: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Found ${vouchers.length} vouchers:\n`);

    if (vouchers.length === 0) {
      console.log('   No vouchers found for this customer.\n');
      
      // Check redemptions without vouchers
      const redemptions = await prisma.redemption.findMany({
        where: { customerId: customer.id },
        include: {
          reward: true
        }
      });
      
      if (redemptions.length > 0) {
        console.log(`⚠️  Found ${redemptions.length} redemptions without vouchers:\n`);
        redemptions.forEach(r => {
          console.log(`   • ${r.reward.name} | ${r.points} pts | ${new Date(r.createdAt).toLocaleDateString()}`);
        });
      }
    } else {
      vouchers.forEach((v, index) => {
        console.log(`${index + 1}. ${v.reward.name}`);
        console.log(`   Code: ${v.code}`);
        console.log(`   Status: ${v.status}`);
        console.log(`   Points: ${v.reward.points}`);
        console.log(`   Tenant: ${v.reward.tenant?.name || 'Unknown'}`);
        console.log(`   Created: ${new Date(v.createdAt).toLocaleDateString()}`);
        console.log(`   Expires: ${v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : 'No expiry'}`);
        console.log(`   Used: ${v.usedAt ? new Date(v.usedAt).toLocaleDateString() : 'Not used'}`);
        console.log('');
      });
    }

    // Check recent SPENT transactions for this customer
    const spentTransactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        type: 'SPENT',
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`💳 Recent SPENT transactions (${spentTransactions.length}):\n`);
    spentTransactions.forEach(t => {
      console.log(`   • £${t.amount.toFixed(2)} | ${t.points} pts | ${t.status} | ${new Date(t.createdAt).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerVouchers();


