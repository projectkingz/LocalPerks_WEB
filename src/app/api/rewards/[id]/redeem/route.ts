import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rewardId = params.id;

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get reward
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Check if customer has enough points
    if (customer.points < reward.points) {
      return NextResponse.json({ 
        error: 'Insufficient points',
        required: reward.points,
        available: customer.points
      }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create redemption
      const redemption = await tx.redemption.create({
        data: {
          rewardId: reward.id,
          customerId: customer.id,
          points: reward.points,
        },
      });

      // Generate unique voucher code
      const voucherCode = `LP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create voucher
      const voucher = await tx.voucher.create({
        data: {
          code: voucherCode,
          redemptionId: redemption.id,
          customerId: customer.id,
          rewardId: reward.id,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      // Update customer points
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          points: customer.points - reward.points
        }
      });

      // Create transaction record
      const user = await tx.user.findUnique({
        where: { email: session.user.email! }
      });

      if (user) {
        await tx.transaction.create({
          data: {
            amount: 0, // No monetary amount for redemptions
            points: reward.points,
            type: 'SPENT',
            status: 'APPROVED',
            userId: user.id,
            customerId: customer.id,
            tenantId: customer.tenantId,
          },
        });
      }

      return { voucher, updatedCustomer, redemption };
    });

    return NextResponse.json({
      message: 'Reward redeemed successfully',
      voucher: {
        id: result.voucher.id,
        code: result.voucher.code,
        rewardName: reward.name,
        expiresAt: result.voucher.expiresAt,
        status: result.voucher.status,
      },
      newPointsBalance: result.updatedCustomer.points,
    });

  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
  }
}



