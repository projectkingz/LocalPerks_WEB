import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { pointsUtil } from '@/lib/pointsUtil';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';
  const session = await getServerSession(authOptions);
  let role = session?.user?.role as string | undefined;
  let tenantId = (session?.user as any)?.tenantId as string | undefined;
  let email = session?.user?.email as string | undefined;

  if (!role) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload) {
      role = (payload as any).role;
      tenantId = payload.tenantId || undefined;
      email = payload.email;
    }
  }

  // Check if user is authenticated and has appropriate role
  if (!role || !['ADMIN', 'PARTNER', 'CUSTOMER'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'halfyear':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build tenant filter - partners only see their tenant data, admins see all
    const tenantFilter = role === 'PARTNER' && tenantId 
      ? { tenantId }
      : {};

    // Get total customers (filtered by tenant for partners)
    const totalCustomers = await prisma.customer.count({
      where: tenantFilter
    });

    // Get points issued (sum of all EARNED transactions)
    const pointsIssuedResult = await prisma.transaction.aggregate({
      where: {
        type: 'EARNED',
        status: 'APPROVED',
        createdAt: {
          gte: startDate
        },
        ...tenantFilter
      },
      _sum: {
        points: true
      }
    });
    const pointsIssued = pointsIssuedResult._sum.points || 0;

    // Get average transaction amount
    const avgTransactionResult = await prisma.transaction.aggregate({
      where: {
        type: 'EARNED',
        status: 'APPROVED',
        amount: {
          gt: 0
        },
        createdAt: {
          gte: startDate
        },
        ...tenantFilter
      },
      _avg: {
        amount: true
      }
    });
    const avgTransaction = avgTransactionResult._avg.amount || 0;

    // Get recent points issued transactions
    const recentPointsIssued = await prisma.transaction.findMany({
      where: {
        type: 'EARNED',
        status: 'APPROVED',
        createdAt: {
          gte: startDate
        },
        ...tenantFilter
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get recent points redeemed transactions (SPENT) and refunds (REFUND)
    const recentPointsRedeemed = await prisma.transaction.findMany({
      where: {
        type: { in: ['SPENT', 'REFUND'] },
        status: 'APPROVED',
        createdAt: {
          gte: startDate
        },
        ...tenantFilter
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get all recent transactions (unified list for recent activity)
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: startDate
        },
        ...tenantFilter
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 15
    });

    // Get popular rewards (rewards with most redemptions)
    // For partners, we need to filter redemptions by their customers
    let popularRewards;
    if (role === 'PARTNER' && tenantId) {
      // Get customer IDs for this tenant
      const tenantCustomerIds = await prisma.customer.findMany({
        where: { tenantId },
        select: { id: true }
      });
      const customerIds = tenantCustomerIds.map(c => c.id);

      popularRewards = await prisma.redemption.groupBy({
        by: ['rewardId'],
        where: {
          customerId: { in: customerIds },
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });
    } else {
      // Admin sees all redemptions
      popularRewards = await prisma.redemption.groupBy({
        by: ['rewardId'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });
    }

    // Get reward details for popular rewards
    const popularRewardsWithDetails = await Promise.all(
      popularRewards.map(async (redemption) => {
        const reward = await prisma.reward.findUnique({
          where: { id: redemption.rewardId }
        });

        // Calculate total points issued for this reward
        let pointsIssuedForReward;
        if (role === 'PARTNER' && tenantId) {
          // Get customer IDs for this tenant
          const tenantCustomerIds = await prisma.customer.findMany({
            where: { tenantId },
            select: { id: true }
          });
          const customerIds = tenantCustomerIds.map(c => c.id);

          pointsIssuedForReward = await prisma.redemption.aggregate({
            where: {
              rewardId: redemption.rewardId,
              customerId: { in: customerIds },
              createdAt: {
                gte: startDate
              }
            },
            _sum: {
              points: true
            }
          });
        } else {
          pointsIssuedForReward = await prisma.redemption.aggregate({
            where: {
              rewardId: redemption.rewardId,
              createdAt: {
                gte: startDate
              }
            },
            _sum: {
              points: true
            }
          });
        }

        return {
          reward: reward ? {
            id: reward.id,
            name: reward.name,
            description: reward.description,
            points: reward.points,
            createdAt: reward.createdAt
          } : null,
          pointsIssued: pointsIssuedForReward._sum.points || 0,
          numberRedeemed: redemption._count.id
        };
      })
    );

    // Compute current user's points and tier for mobile dashboard (match web logic)
    let currentUserPoints = 0;
    let currentUserTier = 'Standard';
    if (role === 'CUSTOMER' && email) {
      const customer = await prisma.customer.findUnique({ where: { email } });
      if (customer) {
        // Use transactions-derived points for consistency with web
        currentUserPoints = await pointsUtil.calculateCustomerPoints(customer.id);
        if (currentUserPoints >= 1000) currentUserTier = 'Platinum';
        else if (currentUserPoints >= 500) currentUserTier = 'Gold';
        else if (currentUserPoints >= 100) currentUserTier = 'Silver';
      }
    }

    const stats = {
      // Mobile-focused fields
      points: currentUserPoints,
      tier: currentUserTier,
      totalCustomers,
      pointsIssued,
      avgTransaction,
      recentPointsIssued: recentPointsIssued.map(t => ({
        id: t.id,
        description: 'Points earned',
        points: t.points,
        createdAt: t.createdAt,
        user: {
          name: t.customer?.name,
          email: t.customer?.email
        }
      })),
      recentPointsRedeemed: recentPointsRedeemed.map(t => ({
        id: t.id,
        description: t.type === 'REFUND' ? 'Refund processed' : 'Points spent',
        points: t.points, // Points are already negative for REFUND and SPENT
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt,
        user: {
          name: t.customer?.name,
          email: t.customer?.email
        }
      })),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        description: t.type === 'EARNED' 
          ? 'Purchase' 
          : t.type === 'REFUND' 
          ? 'Refund processed'
          : 'Reward redeemed',
        points: t.points,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt,
        user: {
          name: t.customer?.name,
          email: t.customer?.email
        }
      })),
      popularRewards: popularRewardsWithDetails
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 