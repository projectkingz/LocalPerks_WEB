import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pointsUtil } from '@/lib/pointsUtil';
import { getTenantPointsConfig, calculatePointsForDiscount } from '@/lib/pointsCalculation';
import { generateUniqueVoucherCode, checkAndUpdateExpiredVouchers } from '@/lib/utils/voucher';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get customer's vouchers from database
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check and update any expired vouchers first
    await checkAndUpdateExpiredVouchers();

    // Get actual vouchers for this customer
    const vouchers = await (prisma as any).voucher.findMany({
      where: { customerId: customer.id },
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
            // points field doesn't exist on Reward model - get from redemption instead
            discountPercentage: true,
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        redemption: {
          select: {
            id: true,
            points: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Session data:', {
    userEmail: session.user.email,
    userId: session.user.id,
    userName: session.user.name
  });

  try {
    const body = await request.json();
    
    const { rewardId, points } = body;

    if (!rewardId) {
      console.log('Missing fields - rewardId:', rewardId, 'points:', points);
      return NextResponse.json({ 
        error: 'Missing required fields', 
        received: { rewardId, points },
        required: ['rewardId']
      }, { status: 400 });
    }

    // Check if reward exists (include tenant for points config)
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      include: { tenant: true },
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate points required for £ amount discounts (parse from reward name, e.g. "£35 Discount Voucher")
    let pointsToDeduct = 0;
    let discountAmount: number | null = null;
    const amountMatch = reward.name.match(/£(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      discountAmount = parseFloat(amountMatch[1]);
      const config = await getTenantPointsConfig(reward.tenantId);
      pointsToDeduct = calculatePointsForDiscount(discountAmount, config);
    }

    // Check customer has enough points
    const currentPoints = await pointsUtil.calculateCustomerPoints(customer.id);
    if (pointsToDeduct > 0 && currentPoints < pointsToDeduct) {
      return NextResponse.json(
        {
          error: 'Insufficient points',
          required: pointsToDeduct,
          available: currentPoints,
          message: `You need ${pointsToDeduct.toLocaleString()} points but only have ${currentPoints.toLocaleString()} points.`,
        },
        { status: 400 }
      );
    }

    // Ensure customer has User record for transactions
    const userId = await pointsUtil.ensureCustomerUserRecord(
      session.user.email!,
      customer.name,
      customer.tenantId ?? undefined
    );

    // Use reward's tenant for transaction (or customer's tenant, or system default)
    const tenantIdForTx = reward.tenantId;

    const result = await prisma.$transaction(async (tx: any) => {
      const redemption = await tx.redemption.create({
        data: {
          rewardId,
          customerId: customer.id,
          points: pointsToDeduct,
        },
        include: { reward: true },
      });

      const code = await generateUniqueVoucherCode();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const voucher = await tx.voucher.create({
        data: {
          code,
          redemptionId: redemption.id,
          customerId: customer.id,
          rewardId,
          status: 'active',
          expiresAt,
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          reward: { select: { id: true, name: true, description: true, discountPercentage: true } },
        },
      });

      // Create SPENT transaction to deduct points from customer balance
      if (pointsToDeduct > 0) {
        await tx.transaction.create({
          data: {
            amount: discountAmount ?? 0,
            points: pointsToDeduct,
            type: 'SPENT',
            status: 'APPROVED',
            userId,
            customerId: customer.id,
            tenantId: tenantIdForTx,
          },
        });

        await tx.customer.update({
          where: { id: customer.id },
          data: { points: Math.max(0, currentPoints - pointsToDeduct) },
        });
      }

      return { redemption, customer, voucher };
    });

    const pointsBreakdown = await pointsUtil.getCustomerPointsBreakdown(customer.id);
    const remainingPoints = pointsBreakdown.actualPoints;

    return NextResponse.json({
      message: 'Voucher created successfully',
      voucher: result.voucher,
      pointsDeducted: pointsToDeduct,
      remainingPoints,
      points: pointsToDeduct,
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    if (error instanceof Error && error.message.includes('Insufficient points')) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}

// Redeem a voucher
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { voucherId } = await request.json();

    if (!voucherId) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 });
    }

    // Find the redemption in the database
    const redemption = await prisma.redemption.findUnique({
      where: { id: voucherId },
      include: {
        customer: true,
        reward: true
      }
    });

    if (!redemption) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (redemption.customer.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vouchers are already redeemed when created, so just return success
    return NextResponse.json({ 
      message: 'Voucher redeemed successfully', 
      voucher: {
        id: redemption.id,
        customerEmail: redemption.customer.email,
        rewardId: redemption.rewardId,
        points: redemption.points,
        createdAt: redemption.createdAt.toISOString(),
        redeemedAt: redemption.createdAt.toISOString(),
        reward: redemption.reward
      }
    });
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 });
  }
} 