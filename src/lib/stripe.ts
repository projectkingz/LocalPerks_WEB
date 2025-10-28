import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe webhook secret for verifying webhook signatures
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Subscription tier mapping
export const SUBSCRIPTION_TIER_PRODUCT_IDS = {
  BASIC: process.env.STRIPE_BASIC_PRODUCT_ID || 'prod_basic',
  PLUS: process.env.STRIPE_PLUS_PRODUCT_ID || 'prod_plus', 
  PREMIUM: process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_premium',
  ELITE: process.env.STRIPE_ELITE_PRODUCT_ID || 'prod_elite',
};

// Helper function to get product ID for a subscription tier
export function getProductIdForTier(tierName: string): string {
  const productId = SUBSCRIPTION_TIER_PRODUCT_IDS[tierName as keyof typeof SUBSCRIPTION_TIER_PRODUCT_IDS];
  if (!productId) {
    throw new Error(`No Stripe product ID configured for tier: ${tierName}`);
  }
  return productId;
}

// Helper function to create or get Stripe customer
export async function getOrCreateStripeCustomer(email: string, name: string, tenantId: string) {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        tenantId: tenantId,
        type: 'partner',
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating/finding Stripe customer:', error);
    throw error;
  }
}

// Helper function to create subscription
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  tenantId: string,
  tierName: string
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenantId: tenantId,
        tierName: tierName,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

// Helper function to create price for a subscription tier
export async function createOrGetPrice(productId: string, amount: number, currency: string = 'gbp') {
  try {
    // Check if price already exists for this product and amount
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    const existingPrice = existingPrices.data.find(
      price => price.unit_amount === Math.round(amount * 100) && price.currency === currency
    );

    if (existingPrice) {
      return existingPrice;
    }

    // Create new price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to pence
      currency: currency,
      recurring: {
        interval: 'day',
        interval_count: 28, // 28-day billing cycle
      },
    });

    return price;
  } catch (error) {
    console.error('Error creating Stripe price:', error);
    throw error;
  }
}

// Helper function to create product for a subscription tier
export async function createOrGetProduct(tierName: string, displayName: string) {
  try {
    const productId = getProductIdForTier(tierName);
    
    // Try to retrieve existing product
    try {
      const product = await stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      // Product doesn't exist, create it
      const product = await stripe.products.create({
        id: productId,
        name: `${displayName} Subscription`,
        description: `Monthly subscription for ${displayName} tier partners`,
        metadata: {
          tierName: tierName,
          type: 'subscription',
        },
      });

      return product;
    }
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw error;
  }
}




