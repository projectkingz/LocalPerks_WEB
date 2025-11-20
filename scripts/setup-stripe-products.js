const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices...');

    // Get subscription tiers from database
    const tiers = await prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    console.log(`Found ${tiers.length} subscription tiers`);

    for (const tier of tiers) {
      console.log(`\nSetting up ${tier.displayName} tier...`);

      // Create or get product
      const productId = `prod_${tier.name.toLowerCase()}`;
      let product;

      try {
        product = await stripe.products.retrieve(productId);
        console.log(`✓ Product ${productId} already exists`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          product = await stripe.products.create({
            id: productId,
            name: `${tier.displayName} Subscription`,
            description: `Monthly subscription for ${tier.displayName} tier partners`,
            metadata: {
              tierName: tier.name,
              type: 'subscription',
            },
          });
          console.log(`✓ Created product ${productId}`);
        } else {
          throw error;
        }
      }

      // Create or get price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      const existingPrice = existingPrices.data.find(
        price => price.unit_amount === Math.round(tier.price * 100) && 
                 price.currency === 'gbp' &&
                 price.recurring?.interval === 'day' &&
                 price.recurring?.interval_count === 28
      );

      if (existingPrice) {
        console.log(`✓ Price for £${tier.price} already exists`);
      } else {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(tier.price * 100), // Convert to pence
          currency: 'gbp',
          recurring: {
            interval: 'day',
            interval_count: 28, // 28-day billing cycle
          },
          metadata: {
            tierName: tier.name,
          },
        });
        console.log(`✓ Created price £${tier.price} for ${tier.displayName}`);
      }
    }

    console.log('\n✅ Stripe products and prices setup completed!');
    console.log('\nNext steps:');
    console.log('1. Set up Stripe webhook endpoint: /api/webhooks/stripe');
    console.log('2. Add webhook secret to environment variables');
    console.log('3. Test the partner registration flow');

  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupStripeProducts()
  .then(() => {
    console.log('Setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup script failed:', error);
    process.exit(1);
  });




