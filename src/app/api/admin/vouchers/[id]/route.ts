import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const voucherId = params.id;
    const body = await request.json();
    const { code, status, expiresAt, usedAt } = body;

    // Validate required fields
    if (!code || !status) {
      return NextResponse.json(
        { error: 'Code and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'used', 'expired'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the voucher
    const updateData: any = {
      code,
      status,
    };

    if (expiresAt) {
      updateData.expiresAt = new Date(expiresAt);
    }

    if (usedAt) {
      updateData.usedAt = new Date(usedAt);
    }

    // If status is 'used' and usedAt is not provided, set it to now
    if (status === 'used' && !usedAt) {
      updateData.usedAt = new Date();
    }

    // If status is 'expired' and expiresAt is not provided, set it to now
    if (status === 'expired' && !expiresAt) {
      updateData.expiresAt = new Date();
    }

    const voucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true,
            tenantId: true,
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            discountPercentage: true,
            validFrom: true,
            validTo: true,
            createdAt: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                partnerUserId: true,
                partnerUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
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

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
