import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { pointsUtil } from '@/lib/pointsUtil';
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

    if (!discountAmount || discountAmount <= 0 || !Number.isInteger(discountAmount)) {
      return NextResponse.json(
        { error: 'Invalid discount amount. Must be a whole number greater than £0.' },
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

    // Calculate ACTUAL points using shared utility (same rules as /api/points)
    const currentPoints = await pointsUtil.calculateCustomerPoints(customer.id);

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

    // Find or create the system tenant for discount rewards
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'LocalPerks System' }
    });

    if (!systemTenant) {
      // Create system tenant if it doesn't exist
      // First, we need a system user to own the tenant
      let systemUser = await prisma.user.findFirst({
        where: { 
          email: 'system@localperks.com',
          role: 'ADMIN'
        }
      });

      if (!systemUser) {
        // Create system admin user
        systemUser = await prisma.user.create({
          data: {
            email: 'system@localperks.com',
            name: 'LocalPerks System',
            role: 'ADMIN',
            approvalStatus: 'ACTIVE'
          }
        });
      }

      // Create system tenant
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'LocalPerks System',
          mobile: '00000000000', // Placeholder
          partnerUserId: systemUser.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'BASIC'
        }
      });

      console.log('Created system tenant:', systemTenant.id);
    }

    // Find or create the discount reward for this amount
    let discountReward = await prisma.reward.findFirst({
      where: {
        name: `£${discountAmount} Discount Voucher`,
        tenantId: systemTenant.id
      }
    });

    if (!discountReward) {
      // Create discount reward if it doesn't exist
      // Note: For fixed-amount discount vouchers (e.g., £34 off), the discountPercentage
      // field is not used. The actual discount amount is the discountAmount parameter
      // passed to this endpoint. The reward is just a template/container.
      discountReward = await prisma.reward.create({
        data: {
          name: `£${discountAmount} Discount Voucher`,
          description: `Fixed-amount discount voucher worth £${discountAmount} off your purchase. The discount amount is fixed at £${discountAmount}, not a percentage.`,
          discountPercentage: 0.0, // Not applicable for fixed-amount vouchers
          tenantId: systemTenant.id,
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          validFrom: new Date(),
          // Valid for a long time (10 years)
          validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
        }
      });

      console.log(`Created discount reward template: £${discountAmount} Discount Voucher`, discountReward.id);
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
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the redemption record
      let redemption;
      try {
        redemption = await tx.redemption.create({
          data: {
            rewardId: discountReward.id,
            customerId: customer.id,
            points: requiredPoints,
          },
          include: {
            reward: true
          }
        });
      } catch (error: any) {
        console.error('Error creating redemption:', error);
        throw new Error(`Failed to create redemption: ${error?.message || 'Unknown error'}`);
      }

      // Generate unique voucher code (inside transaction to ensure uniqueness)
      let voucherCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate a random 8-character code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        voucherCode = '';
        for (let i = 0; i < 8; i++) {
          voucherCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Check if code exists in database (using transaction instance)
        const existingVoucher = await tx.voucher.findUnique({
          where: { code: voucherCode }
        });
        
        if (!existingVoucher) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique voucher code after multiple attempts');
      }
      
      // Set expiration date to 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create the voucher
      let voucher;
      try {
        voucher = await tx.voucher.create({
          data: {
            code: voucherCode!,
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
                discountPercentage: true,
              }
            }
          }
        });
      } catch (error: any) {
        console.error('Error creating voucher:', error);
        console.error('Voucher creation details:', {
          code: voucherCode,
          redemptionId: redemption.id,
          customerId: customer.id,
          rewardId: discountReward.id,
          errorCode: error?.code,
          errorMeta: error?.meta
        });
        throw new Error(`Failed to create voucher: ${error?.message || 'Unknown error'}`);
      }

      // Create transaction record
      // Note: tenantId is optional for customers, so we need to handle null case
      const transactionData: any = {
        amount: discountAmount,
        points: requiredPoints,
        type: 'SPENT',
        status: 'APPROVED',
        user: {
          connect: { id: user.id }
        },
        customer: {
          connect: { id: customer.id }
        }
      };

      // Only connect tenant if it exists
      if (customer.tenantId) {
        transactionData.tenant = {
          connect: { id: customer.tenantId }
        };
      } else {
        // If no tenant, connect to system tenant
        if (!systemTenant || !systemTenant.id) {
          throw new Error('System tenant not found. Cannot create transaction without tenant.');
        }
        transactionData.tenant = {
          connect: { id: systemTenant.id }
        };
      }

      let transaction;
      try {
        transaction = await tx.transaction.create({
          data: transactionData
        });
      } catch (error: any) {
        console.error('Error creating transaction:', error);
        console.error('Transaction data:', transactionData);
        throw new Error(`Failed to create transaction: ${error?.message || 'Unknown error'}`);
      }

      // Update customer balance
      const newPointsBalance = currentPoints - requiredPoints;
      try {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            points: Math.max(0, newPointsBalance)
          }
        });
      } catch (error: any) {
        console.error('Error updating customer balance:', error);
        throw new Error(`Failed to update customer balance: ${error?.message || 'Unknown error'}`);
      }

      // Create activity log
      try {
        await tx.activity.create({
          data: {
            type: 'DISCOUNT_REDEEMED',
            description: `Discount Voucher Redeemed - £${discountAmount} (${requiredPoints} points)`,
            points: -requiredPoints,
            userId: user.id,
          }
        });
      } catch (error: any) {
        console.error('Error creating activity log:', error);
        throw new Error(`Failed to create activity log: ${error?.message || 'Unknown error'}`);
      }

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
  } catch (error: any) {
    console.error('Error redeeming discount:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta
    });
    return NextResponse.json(
      { 
        error: 'Failed to redeem discount',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
