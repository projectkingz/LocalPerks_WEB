import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoucherWithExpirationCheck } from '@/lib/utils/voucher';
import { verifyMobileJwt } from '@/lib/auth/mobile';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email as string | undefined;
  let userRole = session?.user?.role as string | undefined;
  let userTenantId = (session?.user as any)?.tenantId as string | undefined;

  // Check for mobile JWT token if no session
  if (!userEmail) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload) {
      userEmail = payload.email;
      userRole = (payload as any).role;
      userTenantId = payload.tenantId || undefined;
    }
  }

  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { voucherCode } = await request.json();

    if (!voucherCode) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    // Get voucher with automatic expiration check
    const { voucher, error, wasExpired } = await getVoucherWithExpirationCheck(voucherCode);

    if (error) {
      return NextResponse.json({ error }, { status: 404 });
    }

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // If voucher was just marked as expired, return error
    if (wasExpired) {
      return NextResponse.json({ 
        error: 'Voucher has expired',
        voucher
      }, { status: 400 });
    }

    // Check if voucher is suspended (fraud/misuse mitigation)
    if (voucher.status === 'suspended') {
      return NextResponse.json({ 
        error: 'This voucher has been suspended and cannot be used.',
        voucher
      }, { status: 400 });
    }

    // Check if voucher is already used
    if (voucher.status === 'used') {
      return NextResponse.json({ 
        error: 'Voucher has already been used',
        voucher
      }, { status: 400 });
    }

    // Tenant validation: Check if this is a system discount voucher or tenant-specific reward
    if (userRole === 'PARTNER' && userTenantId) {
      // Get the reward with tenant information
      const rewardWithTenant = await prisma.reward.findUnique({
        where: { id: voucher.rewardId },
        select: { 
          tenantId: true,
          name: true,
          tenant: {
            select: { name: true }
          }
        }
      });

      // Check if this is a system discount voucher (LocalPerks System)
      const isSystemDiscountVoucher = rewardWithTenant?.tenant?.name === 'LocalPerks System' || 
                                       rewardWithTenant?.name?.includes('Discount Voucher');

      // Allow any partner to scan system discount vouchers
      if (!isSystemDiscountVoucher && rewardWithTenant && rewardWithTenant.tenantId !== userTenantId) {
        return NextResponse.json({ 
          error: 'This voucher can only be redeemed at the business that issued the reward',
          voucher: {
            ...voucher,
            reward: {
              ...voucher.reward,
              tenantMismatch: true
            }
          }
        }, { status: 403 });
      }

      // Log if this is a system discount voucher being scanned
      if (isSystemDiscountVoucher) {
        console.log(`System discount voucher ${voucherCode} being scanned by partner ${userTenantId}`);
      }
    }

    // Find the transaction associated with this voucher redemption
    // For discount vouchers, the transaction contains the discount amount
    const transaction = await prisma.transaction.findFirst({
      where: {
        customerId: voucher.customerId,
        type: 'SPENT',
        status: 'APPROVED',
        // Match by redemption date (transaction created around same time as redemption)
        createdAt: {
          gte: new Date(voucher.redemption.createdAt.getTime() - 60000), // 1 minute before
          lte: new Date(voucher.redemption.createdAt.getTime() + 60000), // 1 minute after
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Extract discount amount from transaction or reward name
    let discountAmount: number | null = null;
    if (transaction) {
      // For fixed-amount discount vouchers, the transaction amount is the discount amount
      discountAmount = transaction.amount;
    } else {
      // Fallback: try to extract from reward name (e.g., "£34 Discount Voucher" -> 34)
      const rewardName = voucher.reward?.name || '';
      const amountMatch = rewardName.match(/£(\d+(?:\.\d+)?)/);
      if (amountMatch) {
        discountAmount = parseFloat(amountMatch[1]);
      }
    }

    // Mark voucher as used
    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id },
      data: { 
        status: 'used',
        usedAt: new Date()
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
      }
    });

    // Voucher redemption does NOT deduct points - points were already deducted when voucher was created
    // Return 0 points to indicate no points deducted during redemption
    return NextResponse.json({
      message: 'Voucher redeemed successfully',
      voucher: updatedVoucher,
      discountAmount: discountAmount, // The fixed £ amount to deduct from customer's bill at POS
      points: 0, // No points deducted - voucher was already paid for when created
      pointsDeducted: 0
    });

  } catch (error) {
    console.error('Error scanning voucher:', error);
    return NextResponse.json({ error: 'Failed to scan voucher' }, { status: 500 });
  }
}

// Get voucher details by code (for validation)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email as string | undefined;
  let userRole = session?.user?.role as string | undefined;
  let userTenantId = (session?.user as any)?.tenantId as string | undefined;

  // Check for mobile JWT token if no session
  if (!userEmail) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload) {
      userEmail = payload.email;
      userRole = (payload as any).role;
      userTenantId = payload.tenantId || undefined;
    }
  }

  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const voucherCode = searchParams.get('code');

    if (!voucherCode) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    // Get voucher with automatic expiration check
    const { voucher, error, wasExpired } = await getVoucherWithExpirationCheck(voucherCode);

    if (error) {
      return NextResponse.json({ error }, { status: 404 });
    }

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Get full voucher details with tenant information
    const fullVoucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
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
      }
    });

    // Find the transaction associated with this voucher redemption for discount amount
    let discountAmount: number | null = null;
    if (fullVoucher?.redemption) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          customerId: fullVoucher.customerId,
          type: 'SPENT',
          status: 'APPROVED',
          createdAt: {
            gte: new Date(fullVoucher.redemption.createdAt.getTime() - 60000),
            lte: new Date(fullVoucher.redemption.createdAt.getTime() + 60000),
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (transaction) {
        discountAmount = transaction.amount;
      } else {
        // Fallback: extract from reward name
        const rewardName = fullVoucher.reward?.name || '';
        const amountMatch = rewardName.match(/£(\d+(?:\.\d+)?)/);
        if (amountMatch) {
          discountAmount = parseFloat(amountMatch[1]);
        }
      }
    }

    return NextResponse.json({ 
      voucher: fullVoucher,
      discountAmount: discountAmount, // The fixed £ amount to deduct from customer's bill at POS
      wasExpired: wasExpired || false
    });

  } catch (error) {
    console.error('Error getting voucher details:', error);
    return NextResponse.json({ error: 'Failed to get voucher details' }, { status: 500 });
  }
} 