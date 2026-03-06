import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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

    // First, get all customers with their transaction, redemption, and tenant information
    // Note: This queries the Customer model, not the User model, so it should only return actual customers
    const customers = await prisma.customer.findMany({
      include: {
        transactions: {
          where: {
            status: { in: ['APPROVED', 'VOID'] }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        redemptions: {
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                discountPercentage: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.debug(`Found ${customers.length} customers in database`);

    // Filter out any customers that might be admin or partner accounts
    // by checking if their email exists in the User table with non-CUSTOMER roles
    const customerEmails = customers.map((c: any) => c.email).filter(Boolean);
    const adminOrPartnerUsers = await prisma.user.findMany({
      where: {
        email: { in: customerEmails },
        role: { in: ['ADMIN', 'PARTNER', 'SUPER_ADMIN'] }
      },
      select: { email: true }
    });
    const excludedEmails = new Set(adminOrPartnerUsers.map(u => u.email));

    const validCustomers = customers.filter((customer: any) => !excludedEmails.has(customer.email));

    logger.debug(`Filtered to ${validCustomers.length} actual customers (excluded admin/partner accounts)`);

    // Calculate additional fields for each customer
    const customersWithCalculations = validCustomers.map((customer: any) => {
      // Calculate total amount spent across all tenants
      const totalAmountSpent = customer.transactions
        .filter((t: any) => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Calculate total points earned
      const totalPointsEarned = customer.transactions
        .filter((t: any) => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum: number, t: any) => sum + t.points, 0);

      // Calculate discount earned (assuming 1 point = £0.008 face value)
      const pointFaceValue = 0.008; // £0.008 per point
      const discountEarned = totalPointsEarned * pointFaceValue;

      return {
        ...customer,
        totalAmountSpent,
        totalPointsEarned,
        discountEarned
      };
    });

    return NextResponse.json(customersWithCalculations);
  } catch (error) {
    logger.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 