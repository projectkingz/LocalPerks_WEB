const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSubscriptionTiers() {
  try {
    console.log('Setting up subscription tiers...');

    // Create default subscription tiers
    const tiers = [
      { name: 'BASIC', displayName: 'Basic', price: 19, isActive: true },
      { name: 'PLUS', displayName: 'Plus', price: 20, isActive: true },
      { name: 'PREMIUM', displayName: 'Premium', price: 21, isActive: true },
      { name: 'ELITE', displayName: 'Elite', price: 22, isActive: true },
    ];

    for (const tier of tiers) {
      await prisma.subscriptionTier.upsert({
        where: { name: tier.name },
        update: tier,
        create: tier,
      });
      console.log(`Created/Updated tier: ${tier.displayName}`);
    }

    console.log('Subscription tiers setup completed!');

  } catch (error) {
    console.error('Error setting up subscription tiers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupSubscriptionTiers()
  .then(() => {
    console.log('Setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup script failed:', error);
    process.exit(1);
  });




