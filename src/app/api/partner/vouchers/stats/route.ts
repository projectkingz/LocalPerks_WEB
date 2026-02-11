import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only partners can access this endpoint
    if (session.user.role !== 'PARTNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!session.user.tenantId) {
      return NextResponse.json({ error: 'Partner has no tenant assigned' }, { status: 400 });
    }

    // Get all rewards for this partner's tenant
    const rewards = await prisma.reward.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        vouchers: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            usedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics for each reward
    const rewardStats = rewards.map(reward => {
      const vouchers = reward.vouchers;
      
      // Vouchers claimed = all vouchers created (any status except non-existent)
      const claimed = vouchers.length;
      
      // Vouchers redeemed = vouchers with status 'used'
      const redeemed = vouchers.filter(v => v.status === 'used').length;
      
      // Active vouchers = vouchers with status 'active'
      const active = vouchers.filter(v => v.status === 'active').length;
      
      // Expired vouchers = vouchers with status 'expired'
      const expired = vouchers.filter(v => v.status === 'expired').length;

      return {
        rewardId: reward.id,
        rewardName: reward.name,
        rewardDescription: reward.description,
        discountPercentage: reward.discountPercentage,
        approvalStatus: reward.approvalStatus,
        validFrom: reward.validFrom,
        validTo: reward.validTo,
        createdAt: reward.createdAt,
        stats: {
          claimed,      // Total vouchers claimed
          redeemed,     // Vouchers redeemed at merchant
          active,       // Currently active vouchers
          expired,      // Expired vouchers
        }
      };
    });

    return NextResponse.json({
      rewards: rewardStats,
      summary: {
        totalRewards: rewards.length,
        totalClaimed: rewardStats.reduce((sum, r) => sum + r.stats.claimed, 0),
        totalRedeemed: rewardStats.reduce((sum, r) => sum + r.stats.redeemed, 0),
        totalActive: rewardStats.reduce((sum, r) => sum + r.stats.active, 0),
        totalExpired: rewardStats.reduce((sum, r) => sum + r.stats.expired, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching partner voucher stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
