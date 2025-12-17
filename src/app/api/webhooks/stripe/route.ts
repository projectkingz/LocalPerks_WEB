import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  const tierName = subscription.metadata.tierName;

  if (!tenantId || !tierName) {
    console.error('Missing metadata in subscription:', subscription.id);
    return;
  }

  try {
    // Get the subscription tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: tierName },
    });

    if (!tier) {
      console.error('Subscription tier not found:', tierName);
      return;
    }

    // Update tenant subscription info
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionTier: tierName,
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: subscription.customer as string,
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
      },
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        tenantId: tenantId,
        tierId: tier.id,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
        amount: tier.price,
      },
    });

    console.log(`Subscription created for tenant ${tenantId}, tier ${tierName}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('Missing tenantId in subscription metadata:', subscription.id);
    return;
  }

  try {
    // Update subscription status
    const status = subscription.status === 'active' ? 'ACTIVE' : 
                  subscription.status === 'canceled' ? 'CANCELLED' :
                  subscription.status === 'past_due' ? 'PAST_DUE' : 'PAUSED';

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
      },
    });

    // Update tenant status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: status,
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
      },
    });

    console.log(`Subscription updated for tenant ${tenantId}, status: ${status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('Missing tenantId in subscription metadata:', subscription.id);
    return;
  }

  try {
    // Update subscription status
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Update tenant status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });

    console.log(`Subscription cancelled for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID in invoice:', invoice.id);
    return;
  }

  try {
    // Find the subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create payment record
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: invoice.amount_paid / 100, // Convert from pence
        status: 'COMPLETED',
        stripePaymentIntentId: (invoice as any).payment_intent as string,
        stripeInvoiceId: invoice.id,
        paidAt: new Date(),
      },
    });

    console.log(`Payment succeeded for subscription ${subscriptionId}, amount: £${invoice.amount_paid / 100}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID in invoice:', invoice.id);
    return;
  }

  try {
    // Find the subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create failed payment record
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: invoice.amount_due / 100, // Convert from pence
        status: 'FAILED',
        stripeInvoiceId: invoice.id,
      },
    });

    // Update subscription status to past due
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    // Update tenant status
    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        subscriptionStatus: 'PAST_DUE',
      },
    });

    console.log(`Payment failed for subscription ${subscriptionId}, amount: £${invoice.amount_due / 100}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}




