import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { 
  getTenantPointsConfig, 
  calculatePointsForDiscount,
  calculatePointsFaceValue 
} from '@/lib/pointsCalculation';

/**
 * POST /api/discounts/redeem
 * Redeem a discount voucher by deducting points from customer balance
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email as string | undefined;
  let userRole = session?.user?.role as string | undefined;

  // Check for mobile JWT token if no session
  if (!userEmail) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload) {
      userEmail = payload.email;
      userRole = (payload as any).role;
    }
  }

  if (!userEmail || userRole !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized. Customer access only.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { discountAmount } = body;

    if (!discountAmount || discountAmount <= 0 || discountAmount > 20) {
      return NextResponse.json(
        { error: 'Invalid discount amount. Must be between £1 and £20.' },
        { status: 400 }
      );
    }

    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { email: userEmail },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get tenant configuration
    const config = await getTenantPointsConfig(customer.tenantId);
    
    // Calculate required points
    const requiredPoints = calculatePointsForDiscount(discountAmount, config);

    // Check if customer has enough points
    if (customer.points < requiredPoints) {
      return NextResponse.json(
        { 
          error: 'Insufficient points',
          required: requiredPoints,
          available: customer.points
        },
        { status: 400 }
      );
    }

    // Get or create user record for the customer
    let user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name,
          role: 'CUSTOMER',
          tenantId: customer.tenantId
        }
      });
    }

    // Log for debugging
    console.log('Creating transaction with:', {
      amount: discountAmount,
      points: requiredPoints,
      type: 'SPENT',
      userId: user.id,
      customerId: customer.id,
      tenantId: customer.tenantId,
      config: config,
    });

    // Validate requiredPoints is not NaN
    if (isNaN(requiredPoints) || !isFinite(requiredPoints)) {
      console.error('Invalid points calculation:', { requiredPoints, discountAmount, config });
      return NextResponse.json(
        { error: 'Invalid points calculation. Please contact support.' },
        { status: 500 }
      );
    }

    // Create redemption transaction with explicit relations for MySQL
    const transaction = await prisma.transaction.create({
      data: {
        amount: discountAmount,
        points: requiredPoints,
        type: 'SPENT',
        status: 'APPROVED',
        user: {
          connect: { id: user.id }
        },
        customer: {
          connect: { id: customer.id }
        },
        tenant: {
          connect: { id: customer.tenantId }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Deduct points from customer balance
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        points: {
          decrement: requiredPoints
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'DISCOUNT_REDEEMED',
        description: `Discount Redeemed - £${discountAmount} (${requiredPoints} points)`,
        points: -requiredPoints,
        userId: user.id,
      }
    });

    console.log(`Discount redeemed: £${discountAmount} for ${customer.email}, ${requiredPoints} points deducted`);

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed £${discountAmount} discount`,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        points: transaction.points,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      customer: {
        pointsRemaining: updatedCustomer.points,
        availableDiscount: calculatePointsFaceValue(updatedCustomer.points, config)
      }
    });
  } catch (error) {
    console.error('Error redeeming discount:', error);
    return NextResponse.json(
      { error: 'Failed to redeem discount' },
      { status: 500 }
    );
  }
}
