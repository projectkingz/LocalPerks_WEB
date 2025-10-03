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

    // Check if voucher is already used
    if (voucher.status === 'used') {
      return NextResponse.json({ 
        error: 'Voucher has already been used',
        voucher
      }, { status: 400 });
    }

    // Tenant validation: Only the tenant that issued the reward can redeem vouchers for it
    if (userRole === 'PARTNER' && userTenantId) {
      // Get the reward with tenant information
      const rewardWithTenant = await prisma.reward.findUnique({
        where: { id: voucher.rewardId },
        select: { tenantId: true }
      });

      if (rewardWithTenant && rewardWithTenant.tenantId !== userTenantId) {
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
      }
    });

    return NextResponse.json({
      message: 'Voucher redeemed successfully',
      voucher: updatedVoucher
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
            points: true,
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      voucher: fullVoucher,
      wasExpired: wasExpired || false
    });

  } catch (error) {
    console.error('Error getting voucher details:', error);
    return NextResponse.json({ error: 'Failed to get voucher details' }, { status: 500 });
  }
} 