import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Invalid or unpaid session' },
        { status: 400 }
      );
    }

    const tenantId = session.metadata?.tenantId;
    const tierName = session.metadata?.tierName;

    if (!tenantId || !tierName) {
      return NextResponse.json(
        { error: 'Missing metadata in session' },
        { status: 400 }
      );
    }

    // Get subscription tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: tierName },
    });

    if (!tier) {
      return NextResponse.json(
        { error: 'Subscription tier not found' },
        { status: 400 }
      );
    }

    // Update tenant with subscription info
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionTier: tierName,
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: session.customer as string,
        nextBillingDate: session.subscription ?
          new Date((session.subscription as any).current_period_end * 1000) :
          new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
      },
      include: {
        partnerUser: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    // Create subscription record if not exists
    if (session.subscription) {
      const existingSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: (session.subscription as any).id },
      });

      if (!existingSubscription) {
        await prisma.subscription.create({
          data: {
            tenantId: tenantId,
            tierId: tier.id,
            status: 'ACTIVE',
            stripeSubscriptionId: (session.subscription as any).id,
            currentPeriodStart: new Date((session.subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((session.subscription as any).current_period_end * 1000),
            nextBillingDate: new Date((session.subscription as any).current_period_end * 1000),
            amount: tier.price,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subscriptionTier: tenant.subscriptionTier,
        subscriptionStatus: tenant.subscriptionStatus,
        nextBillingDate: tenant.nextBillingDate,
      },
      user: tenant.partnerUser ? {
        id: tenant.partnerUser.id,
        email: tenant.partnerUser.email,
      } : null,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
