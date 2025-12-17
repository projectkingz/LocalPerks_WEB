import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pointsUtil } from '@/lib/pointsUtil';
import { generateUniqueVoucherCode, checkAndUpdateExpiredVouchers } from '@/lib/utils/voucher';
import { getTenantPointsConfig, calculatePointsFaceValue } from '@/lib/pointsCalculation';

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
            points: true,
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

    if (!rewardId || points === undefined || points === null) {
      console.log('Missing fields - rewardId:', rewardId, 'points:', points);
      return NextResponse.json({ 
        error: 'Missing required fields', 
        received: { rewardId, points },
        required: ['rewardId', 'points']
      }, { status: 400 });
    }

    // Check if reward exists
    console.log('Looking for reward with ID:', rewardId);
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    console.log('Found reward:', reward);

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Verify the points match the reward
    if (reward.points !== points) {
      return NextResponse.json({ 
        error: 'Points mismatch with reward',
        rewardPoints: reward.points,
        requestedPoints: points
      }, { status: 400 });
    }

    // Get customer and calculate their actual points from transactions
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('Found customer:', {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      tenantId: customer.tenantId
    });

    // Get detailed points breakdown for debugging
    const pointsBreakdown = await pointsUtil.getCustomerPointsBreakdown(customer.id);
    const actualPoints = pointsBreakdown.actualPoints;

    // Validate the point transaction
    const validation = await pointsUtil.validatePointTransaction(customer.id, points);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Insufficient points for redemption',
        details: {
          currentBalance: validation.currentBalance,
          pointsRequired: points,
          balanceAfterRedemption: validation.balanceAfterTransaction,
          validationError: validation.error
        }
      }, { status: 400 });
    }

    // Get tenant configuration to calculate face value
    const config = await getTenantPointsConfig(customer.tenantId);
    const faceValueAmount = calculatePointsFaceValue(points, config);

    // Create redemption and update customer points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure customer has a corresponding User record for transactions
      const userId = await pointsUtil.ensureCustomerUserRecord(
        session.user.email, 
        customer.name, 
        customer.tenantId
      );

      // Create the redemption
      const redemption = await tx.redemption.create({
        data: {
          rewardId,
          customerId: customer.id,
          points,
        },
        include: {
          reward: true
        }
      });

      // Create the voucher for this redemption using the transaction instance
      const code = await generateUniqueVoucherCode();
      
      // Set expiration date to 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      const voucher = await (tx as any).voucher.create({
        data: {
          code,
          redemptionId: redemption.id,
          customerId: customer.id,
          rewardId,
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

      // Create a transaction record for points spent with face value
      const transaction = await tx.transaction.create({
        data: {
          amount: faceValueAmount, // Monetary face value of points (e.g., 130 points × £0.01 = £1.30)
          points: points, // Store positive points value (will be treated as negative when type is SPENT)
          type: 'SPENT',
          status: 'APPROVED',
          userId: userId, // Use the customer's User record
          customerId: customer.id,
          tenantId: customer.tenantId,
        }
      });

      console.log('Created transaction record:', {
        id: transaction.id,
        userId: transaction.userId,
        customerId: transaction.customerId,
        points: transaction.points
      });

      return { redemption, customer, userId, transaction, voucher };
    });

    console.log('Redemption created successfully:', result.redemption.id);

    // Calculate remaining points from transaction history
    const updatedPointsBreakdown = await pointsUtil.getCustomerPointsBreakdown(customer.id);
    const remainingPoints = updatedPointsBreakdown.actualPoints;

    console.log('Remaining points after deduction:', remainingPoints);

    return NextResponse.json({
      message: 'Voucher created successfully',
      voucher: result.voucher,
      pointsDeducted: points,
      remainingPoints: remainingPoints
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