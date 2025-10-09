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
import { generateUniqueVoucherCode } from '@/lib/utils/voucher';

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

    // Calculate ACTUAL points from transactions (same logic as /api/points)
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["APPROVED", "VOID"] },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const actualPoints = transactions.reduce((total, t) => {
      if (t.type === "EARNED" || t.status === "VOID") return total + t.points;
      if (t.type === "SPENT") return total - t.points; // Subtract SPENT points
      return total;
    }, 0);

    const currentPoints = Math.max(0, actualPoints);

    // Get tenant configuration
    const config = await getTenantPointsConfig(customer.tenantId);
    
    console.log('Discount redemption debug:', {
      discountAmount,
      customerEmail: userEmail,
      customerPointsDB: customer.points,
      customerPointsCalculated: currentPoints,
      config: {
        pointFaceValue: config.pointFaceValue,
        basePointsPerPound: config.basePointsPerPound,
      }
    });
    
    // Calculate required points
    const requiredPoints = calculatePointsForDiscount(discountAmount, config);

    console.log('Points calculation:', {
      discountAmount,
      requiredPoints,
      calculation: `${discountAmount} / ${config.pointFaceValue} = ${requiredPoints}`,
      customerHas: currentPoints,
      sufficient: currentPoints >= requiredPoints
    });

    // Check if customer has enough points (use calculated points)
    if (currentPoints < requiredPoints) {
      return NextResponse.json(
        { 
          error: `Insufficient points. You need ${requiredPoints} points but only have ${currentPoints} points.`,
          required: requiredPoints,
          available: currentPoints,
          discountAmount: discountAmount,
          pointFaceValue: config.pointFaceValue
        },
        { status: 400 }
      );
    }

    // Find the system discount reward for this amount
    const systemTenant = await prisma.tenant.findFirst({
      where: { name: 'LocalPerks System' }
    });

    if (!systemTenant) {
      return NextResponse.json(
        { error: 'System discount rewards not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const discountReward = await prisma.reward.findFirst({
      where: {
        name: `£${discountAmount} Discount Voucher`,
        tenantId: systemTenant.id
      }
    });

    if (!discountReward) {
      return NextResponse.json(
        { error: `£${discountAmount} discount reward not found. Please contact support.` },
        { status: 500 }
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

    // Validate requiredPoints is not NaN
    if (isNaN(requiredPoints) || !isFinite(requiredPoints)) {
      console.error('Invalid points calculation:', { requiredPoints, discountAmount, config });
      return NextResponse.json(
        { error: 'Invalid points calculation. Please contact support.' },
        { status: 500 }
      );
    }

    // Create redemption, voucher, and transaction in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the redemption record
      const redemption = await tx.redemption.create({
        data: {
          rewardId: discountReward.id,
          customerId: customer.id,
          points: requiredPoints,
        },
        include: {
          reward: true
        }
      });

      // Generate unique voucher code
      const voucherCode = await generateUniqueVoucherCode();
      
      // Set expiration date to 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create the voucher
      const voucher = await tx.voucher.create({
        data: {
          code: voucherCode,
          redemptionId: redemption.id,
          customerId: customer.id,
          rewardId: discountReward.id,
          status: 'active',
          expiresAt,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          reward: {
            select: {
              id: true,
              name: true,
              description: true,
              points: true,
            }
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
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
        }
      });

      // Update customer balance
      const newPointsBalance = currentPoints - requiredPoints;
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          points: Math.max(0, newPointsBalance)
        }
      });

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'DISCOUNT_REDEEMED',
          description: `Discount Voucher Redeemed - £${discountAmount} (${requiredPoints} points)`,
          points: -requiredPoints,
          userId: user.id,
        }
      });

      return { redemption, voucher, transaction };
    });

    console.log(`Discount voucher created: £${discountAmount} for ${customer.email}, code: ${result.voucher.code}`);

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed £${discountAmount} discount voucher`,
      voucher: {
        id: result.voucher.id,
        code: result.voucher.code,
        amount: discountAmount,
        points: requiredPoints,
        status: result.voucher.status,
        expiresAt: result.voucher.expiresAt,
        reward: result.voucher.reward,
      },
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        points: result.transaction.points,
        type: result.transaction.type,
        status: result.transaction.status,
      },
      customer: {
        pointsRemaining: currentPoints - requiredPoints,
        availableDiscount: calculatePointsFaceValue(currentPoints - requiredPoints, config)
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
