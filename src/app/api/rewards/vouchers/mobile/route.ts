import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { authenticateMobileToken, createMobileSession } from '@/lib/auth/mobile-auth';
import { checkAndUpdateExpiredVouchers } from '@/lib/utils/voucher';

export async function GET(request: NextRequest) {
  try {
    // Try mobile authentication first
    const mobileUser = await authenticateMobileToken(request);
    let session;
    
    if (mobileUser) {
      session = createMobileSession(mobileUser);
    } else {
      // Fall back to NextAuth session
      session = await getServerSession(authOptions);
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


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
    const vouchers = await prisma.voucher.findMany({
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

    // Format vouchers for mobile
    const formattedVouchers = vouchers.map((voucher: any) => ({
      id: voucher.id,
      code: voucher.code,
      status: voucher.status,
      expiresAt: voucher.expiresAt?.toISOString(),
      usedAt: voucher.usedAt?.toISOString(),
      createdAt: voucher.createdAt.toISOString(),
      reward: {
        id: voucher.reward.id,
        title: voucher.reward.name,
        description: voucher.reward.description,
        points: voucher.reward.points,
      },
      customer: {
        id: voucher.customer.id,
        name: voucher.customer.name,
        email: voucher.customer.email,
      },
      redemption: voucher.redemption ? {
        id: voucher.redemption.id,
        points: voucher.redemption.points,
        createdAt: voucher.redemption.createdAt.toISOString(),
      } : null,
    }));

    return NextResponse.json({
      vouchers: formattedVouchers,
      total: formattedVouchers.length,
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

