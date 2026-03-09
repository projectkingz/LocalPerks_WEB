import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all admin user IDs (ADMIN and SUPER_ADMIN roles)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true
      }
    });
    const adminUserIds = adminUsers.map(u => u.id);

    // Fetch all rewards: admin-created/approved ones OR PENDING (partner-submitted) for approval
    const rewards = await prisma.reward.findMany({
      where: {
        OR: [
          { approvedBy: { in: adminUserIds } },
          { approvalStatus: 'PENDING' }
        ]
      },
      include: {
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
        },
        redemptions: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, discountPercentage, discountType, createdAt, tenantId } = body;

    // Validate required fields
    if (!name || !description || discountPercentage === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and discountPercentage are required' },
        { status: 400 }
      );
    }

    // Determine discount type if not provided
    const finalDiscountType = discountType || (discountPercentage === 0 && name.match(/£\d+/) ? 'fixed' : 'percentage');

    // Validate discountPercentage based on type
    if (finalDiscountType === 'percentage') {
      // Percentage discounts must be between 0 and 100
      if (discountPercentage < 0 || discountPercentage > 100) {
        return NextResponse.json(
          { error: 'Discount percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    } else {
      // Fixed amount discounts must have discountPercentage = 0 and £ amount in name
      if (discountPercentage !== 0) {
        return NextResponse.json(
          { error: 'Fixed amount discounts must have discountPercentage set to 0' },
          { status: 400 }
        );
      }
      if (!name.match(/£\d+/)) {
        return NextResponse.json(
          { error: 'Fixed amount discounts must include £ amount in the name (e.g., "£35 Discount Voucher")' },
          { status: 400 }
        );
      }
    }

    // For admin users, tenantId is optional (can be null for LocalPerks rewards)
    let finalTenantId = tenantId;
    
    // Admins can create rewards for any tenant or for the LocalPerks system tenant.
    // 'LocalPerks System' is the canonical name used platform-wide — must match
    // the name used in /api/discounts/redeem to avoid creating duplicate tenants.
    if (!finalTenantId) {
      let defaultTenant = await prisma.tenant.findFirst({
        where: { name: 'LocalPerks System' }
      });

      if (!defaultTenant) {
        // Upsert system user (avoids unique constraint if already exists)
        const systemUser = await prisma.user.upsert({
          where: { email: 'system@localperks.com' },
          create: {
            email: 'system@localperks.com',
            name: 'LocalPerks System',
            role: 'ADMIN',
            suspended: false,
          },
          update: {},
        });

        defaultTenant = await prisma.tenant.create({
          data: {
            name: 'LocalPerks System',
            partnerUserId: systemUser.id,
            mobile: 'N/A',
          },
        });
      }
      finalTenantId = defaultTenant.id;
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        discountPercentage: parseFloat(discountPercentage),
        tenantId: finalTenantId,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        approvalStatus: 'APPROVED', // Admin-created rewards are auto-approved
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      include: {
        redemptions: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { rewardId, action, rejectionReason } = body; // action: 'approve' or 'reject'

    if (!rewardId || !action) {
      return NextResponse.json(
        { error: 'Reward ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a reward' },
        { status: 400 }
      );
    }

    // Update the reward
    const updateData: any = {
      approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedAt: new Date(),
      approvedBy: session.user.id,
    };

    if (action === 'reject') {
      updateData.rejectionReason = rejectionReason;
    }

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: `Reward ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      reward 
    });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 