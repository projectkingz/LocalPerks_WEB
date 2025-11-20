import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user and their tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.tenant) {
      return NextResponse.json(
        { error: 'User or tenant not found' },
        { status: 404 }
      );
    }

    // Check if tenant has active subscription
    const hasActiveSubscription = user.tenant.subscriptions.length > 0 || 
                                 user.tenant.subscriptionStatus === 'ACTIVE';

    return NextResponse.json({
      hasActiveSubscription,
      subscriptionStatus: user.tenant.subscriptionStatus,
      subscriptionTier: user.tenant.subscriptionTier,
      nextBillingDate: user.tenant.nextBillingDate,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}




