import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer, createOrGetProduct, createOrGetPrice } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, name, tenantId, tierName = 'BASIC' } = await req.json();

    if (!email || !name || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, tenantId' },
        { status: 400 }
      );
    }

    // Get subscription tier details
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: tierName },
    });

    if (!tier) {
      return NextResponse.json(
        { error: `Subscription tier not found: ${tierName}` },
        { status: 400 }
      );
    }

    // Create or get Stripe product and price
    console.log(`Creating product and price for tier: ${tierName}, price: £${tier.price}`);
    const product = await createOrGetProduct(tierName, tier.displayName);
    console.log(`Product created/found: ${product.id}`);
    const price = await createOrGetPrice(product.id, tier.price);
    console.log(`Price created/found: ${price.id}`);

    // Create or get Stripe customer
    const customer = await getOrCreateStripeCustomer(email, name, tenantId);

    // Get base URL with proper scheme
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/partner/signup-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/partner?cancelled=true`;
    
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Success URL: ${successUrl}`);
    console.log(`Cancel URL: ${cancelUrl}`);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId: tenantId,
        tierName: tierName,
        type: 'partner_signup',
      },
      subscription_data: {
        metadata: {
          tenantId: tenantId,
          tierName: tierName,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create checkout session';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
