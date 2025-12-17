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

    // First, get all customers with their transaction and redemption information
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
                points: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get tenant information separately to handle potential null references
    const customersWithTenants = await Promise.all(
      customers.map(async (customer: any) => {
        let tenant = null;
        try {
          tenant = await prisma.tenant.findUnique({
            where: { id: customer.tenantId },
            select: {
              id: true,
              name: true,
            }
          });
        } catch (error) {
          console.warn(`Could not find tenant for customer ${customer.id}:`, error);
        }

        return {
          ...customer,
          tenant
        };
      })
    );

    // Debug: Log the number of customers found
    console.log(`Found ${customers.length} customers in database`);

    // Filter out any customers that might be admin or partner accounts
    // by checking if their email exists in the User table with non-CUSTOMER roles
    const filteredCustomers = await Promise.all(
      customersWithTenants.map(async (customer) => {
        // Check if this email exists in the User table with ADMIN or PARTNER role
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
          select: { role: true }
        });

        // Only include if user doesn't exist or has CUSTOMER role
        if (!user || user.role === 'CUSTOMER') {
          return customer;
        }
        return null;
      })
    );

    // Remove null values (admin/partner accounts)
    const validCustomers = filteredCustomers.filter(customer => customer !== null);

    console.log(`Filtered to ${validCustomers.length} actual customers (excluded admin/partner accounts)`);

    // Calculate additional fields for each customer
    const customersWithCalculations = validCustomers.map(customer => {
      // Calculate total amount spent across all tenants
      const totalAmountSpent = customer.transactions
        .filter(t => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total points earned
      const totalPointsEarned = customer.transactions
        .filter(t => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.points, 0);

      // Calculate discount earned (assuming 1 point = £0.01 face value)
      const pointFaceValue = 0.01; // £0.01 per point
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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 