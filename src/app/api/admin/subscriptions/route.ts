import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

async function requireSuperAdmin(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== 'SUPER_ADMIN') {
      return null;
    }
    return token;
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all partners with their subscription and payment data
    const partners = await prisma.user.findMany({
      where: {
        role: 'PARTNER',
        tenant: {
          isNot: null
        }
      },
      include: {
        tenant: {
          include: {
            subscriptions: {
              include: {
                tier: {
                  select: {
                    displayName: true,
                    price: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch payment data for each partner
    const subscriptionsWithPayments = await Promise.all(
      partners.map(async (partner) => {
        const payments = await prisma.subscriptionPayment.findMany({
          where: {
            subscription: {
              tenantId: partner.tenant?.id
            }
          },
          orderBy: {
            paidAt: 'desc'
          }
        });

        return {
          user: {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            createdAt: partner.createdAt.toISOString()
          },
          tenant: {
            id: partner.tenant?.id || '',
            name: partner.tenant?.name || '',
            subscriptionTier: partner.tenant?.subscriptionTier || '',
            subscriptionStatus: partner.tenant?.subscriptionStatus || '',
            nextBillingDate: partner.tenant?.nextBillingDate?.toISOString() || ''
          },
          subscriptions: partner.tenant?.subscriptions.map(sub => ({
            id: sub.id,
            status: sub.status,
            amount: sub.amount,
            currentPeriodStart: sub.currentPeriodStart.toISOString(),
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
            nextBillingDate: sub.nextBillingDate.toISOString(),
            tier: sub.tier
          })) || [],
          payments: payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            paidAt: payment.paidAt?.toISOString() || '',
            createdAt: payment.createdAt.toISOString()
          }))
        };
      })
    );

    return NextResponse.json({
      subscriptions: subscriptionsWithPayments
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
