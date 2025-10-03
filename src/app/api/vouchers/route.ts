import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const vouchers = await prisma.voucher.findMany({
      where: { customerId: customer.id },
      include: {
        reward: {
          select: {
            name: true,
            description: true,
            points: true,
          },
        },
        redemption: {
          select: {
            id: true,
            points: true,
            createdAt: true,
          },
        },
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

// Mark voucher as used
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { voucherId } = await request.json();

    if (!voucherId) {
      return NextResponse.json({ error: 'Voucher ID required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify voucher belongs to customer
    const voucher = await prisma.voucher.findFirst({
      where: {
        id: voucherId,
        customerId: customer.id,
        status: 'active'
      }
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found or already used' }, { status: 404 });
    }

    // Mark as used
    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
      include: {
        reward: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Voucher marked as used',
      voucher: updatedVoucher
    });

  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
  }
}



