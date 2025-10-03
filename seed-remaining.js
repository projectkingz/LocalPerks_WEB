const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRemainingData() {
  try {
    console.log('🌱 Seeding remaining data...');
    
    // Get some customers and rewards for voucher creation
    const customers = await prisma.customer.findMany({
      take: 50,
      include: { tenant: true }
    });
    
    const rewards = await prisma.reward.findMany({
      take: 100,
      include: { tenant: true }
    });
    
    console.log(`📊 Found ${customers.length} customers and ${rewards.length} rewards`);
    
    // Create redemptions and vouchers
    console.log('🎫 Creating redemptions and vouchers...');
    const vouchers = [];
    
    for (let i = 0; i < 200; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      
      // Only create redemption if customer has enough points
      if (customer.points >= reward.points) {
        // First create a redemption
        const redemption = await prisma.redemption.create({
          data: {
            customerId: customer.id,
            rewardId: reward.id,
            points: reward.points
          }
        });
        
        // Then create a voucher linked to the redemption
        const voucher = await prisma.voucher.create({
          data: {
            code: `VOUCHER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            redemptionId: redemption.id,
            customerId: customer.id,
            rewardId: reward.id,
            status: Math.random() > 0.2 ? 'active' : 'used', // 80% active, 20% used
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            usedAt: Math.random() > 0.8 ? new Date() : null // 20% chance of being used
          }
        });
        vouchers.push(voucher);
      }
    }
    
    console.log(`✅ Created ${vouchers.length} vouchers`);
    
    // Create some additional transactions for recent activity
    console.log('💰 Creating additional recent transactions...');
    const recentTransactions = [];
    
    // Get a partner user for transactions
    const partnerUser = await prisma.user.findFirst({
      where: { role: 'PARTNER' }
    });
    
    if (partnerUser) {
      for (let i = 0; i < 50; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const tenant = await prisma.tenant.findFirst({
          where: { id: customer.tenantId }
        });
        
        if (tenant) {
          const amount = Math.random() * 100 + 10; // £10-110
          const points = Math.floor(amount * (Math.random() * 10 + 5)); // 5-15 points per pound
          
          const transaction = await prisma.transaction.create({
            data: {
              amount: amount,
              points: points,
              type: 'EARNED',
              status: 'APPROVED',
              customerId: customer.id,
              tenantId: tenant.id,
              userId: partnerUser.id,
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          });
          recentTransactions.push(transaction);
        }
      }
    }
    
    console.log(`✅ Created ${recentTransactions.length} recent transactions`);
    
    // Final statistics
    const finalStats = {
      users: await prisma.user.count(),
      tenants: await prisma.tenant.count(),
      rewards: await prisma.reward.count(),
      customers: await prisma.customer.count(),
      transactions: await prisma.transaction.count(),
      vouchers: await prisma.voucher.count()
    };
    
    console.log('\n📊 Final Database Statistics:');
    console.log(`👥 Users: ${finalStats.users}`);
    console.log(`🏢 Tenants: ${finalStats.tenants}`);
    console.log(`🎁 Rewards: ${finalStats.rewards}`);
    console.log(`👤 Customers: ${finalStats.customers}`);
    console.log(`💰 Transactions: ${finalStats.transactions}`);
    console.log(`🎫 Vouchers: ${finalStats.vouchers}`);
    
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding remaining data:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRemainingData();
