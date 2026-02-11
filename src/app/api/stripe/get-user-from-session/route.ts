import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID not found in session metadata' },
        { status: 400 }
      );
    }

    const tenantId = session.metadata.tenantId;

    // Get the tenant and associated user
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        partnerUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!tenant || !tenant.partnerUser) {
      return NextResponse.json(
        { error: 'Tenant or user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: tenant.partnerUser.id,
      email: tenant.partnerUser.email,
      name: tenant.partnerUser.name,
      tenantId: tenant.id,
    });
  } catch (error) {
    console.error('Error getting user from session:', error);
    return NextResponse.json(
      { error: 'Failed to get user from session' },
      { status: 500 }
    );
  }
}





