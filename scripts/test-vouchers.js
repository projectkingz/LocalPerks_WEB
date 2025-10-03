const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVouchers() {
  try {
    console.log('Testing voucher creation...\n');

    // Get total voucher count
    const totalVouchers = await prisma.voucher.count();
    console.log(`Total vouchers created: ${totalVouchers}`);

    // Get vouchers by status
    const activeVouchers = await prisma.voucher.count({
      where: { status: 'active' }
    });
    const usedVouchers = await prisma.voucher.count({
      where: { status: 'used' }
    });
    const expiredVouchers = await prisma.voucher.count({
      where: { status: 'expired' }
    });

    console.log(`Active vouchers: ${activeVouchers}`);
    console.log(`Used vouchers: ${usedVouchers}`);
    console.log(`Expired vouchers: ${expiredVouchers}\n`);

    // Get sample vouchers with customer and reward info
    const sampleVouchers = await prisma.voucher.findMany({
      take: 10,
      include: {
        customer: true,
        reward: {
          include: {
            tenant: true
          }
        },
        redemption: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Sample vouchers:');
    sampleVouchers.forEach((voucher, index) => {
      console.log(`${index + 1}. Code: ${voucher.code}`);
      console.log(`   Customer: ${voucher.customer.name} (${voucher.customer.email})`);
      console.log(`   Reward: ${voucher.reward.name} from ${voucher.reward.tenant.name}`);
      console.log(`   Status: ${voucher.status}`);
      console.log(`   Points: ${voucher.redemption.points}`);
      console.log(`   Expires: ${voucher.expiresAt ? voucher.expiresAt.toLocaleDateString() : 'N/A'}`);
      console.log(`   Used: ${voucher.usedAt ? voucher.usedAt.toLocaleDateString() : 'N/A'}`);
      console.log('');
    });

    // Check vouchers per customer
    const customerVoucherCounts = await prisma.voucher.groupBy({
      by: ['customerId'],
      _count: {
        id: true
      }
    });

    const avgVouchersPerCustomer = customerVoucherCounts.reduce((sum, item) => sum + item._count.id, 0) / customerVoucherCounts.length;
    console.log(`Average vouchers per customer: ${avgVouchersPerCustomer.toFixed(2)}`);

    // Check if all customers have vouchers
    const totalCustomers = await prisma.customer.count();
    const customersWithVouchers = customerVoucherCounts.length;
    console.log(`Customers with vouchers: ${customersWithVouchers}/${totalCustomers}`);

  } catch (error) {
    console.error('Error testing vouchers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVouchers(); 