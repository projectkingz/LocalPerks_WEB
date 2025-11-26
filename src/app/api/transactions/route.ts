import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { calculatePointsForTransaction, calculatePoints } from '@/lib/pointsCalculation';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email as string | undefined;
  let userRole = session?.user?.role as string | undefined;
  let userTenantId = (session?.user as any)?.tenantId as string | undefined;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

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
    // Get user's transactions based on their role
    let transactions;
    let total = 0;
    let whereClause: any = {};
    
    if (userRole === 'ADMIN') {
      // Admin can see all transactions
      total = await prisma.transaction.count();
      transactions = await prisma.transaction.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
    } else if (userRole === 'PARTNER') {
      // Partner can see transactions for their tenant
      if (!userTenantId) {
        return NextResponse.json({ error: 'No tenant found for partner' }, { status: 404 });
      }
      whereClause = { tenantId: userTenantId };
      total = await prisma.transaction.count({ where: whereClause });
      transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
    } else {
      // Customer can only see their own transactions
      const customer = await prisma.customer.findUnique({
        where: { email: userEmail }
      });
      
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      whereClause = { customerId: customer.id };
      total = await prisma.transaction.count({ where: whereClause });
      transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
    }

    // Format transactions for response
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      amount: t.amount,
      points: t.points,
      description: t.type === 'EARNED' ? 'Points earned' : t.type === 'REFUND' ? 'Refund processed' : 'Points spent',
      type: t.type,
      status: t.status,
      customer: t.customer ? {
        id: t.customer.id,
        name: t.customer.name,
        email: t.customer.email
      } : undefined
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    console.log('Transaction request body:', body);
    
    // Support both old format (customerId, tenantId) and new format (customerEmail, source)
    const { amount, customerId, tenantId, customerEmail, source, points, type } = body;

    // Determine if this is a mobile request
    const isMobileRequest = source === 'partner' && customerEmail;

    if (isMobileRequest) {
      // Mobile partner request - find customer by email
      if (!amount || !customerEmail || !userTenantId) {
        return NextResponse.json({ error: 'Missing required fields: amount, customerEmail, or tenantId' }, { status: 400 });
      }

      // Find customer by email (any tenant - partners can process any customer)
      const customer = await prisma.customer.findFirst({
        where: { 
          email: customerEmail
        }
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Determine if this is a refund (negative amount)
      const isRefund = amount < 0;
      const absoluteAmount = Math.abs(amount);
      
      // Calculate points based on absolute amount using tenant-specific config
      // For refunds, we'll negate the points
      let calculatedPoints = points || await calculatePointsForTransaction(absoluteAmount, userTenantId);
      if (isRefund) {
        calculatedPoints = -calculatedPoints; // Make points negative for refunds
      }

      // Determine transaction type
      const transactionType = type || (isRefund ? 'REFUND' : 'EARNED');

      // For refunds, verify customer has enough points
      if (isRefund) {
        const currentPoints = await prisma.transaction.aggregate({
          where: {
            customerId: customer.id,
            status: { in: ['APPROVED', 'VOID'] }
          },
          _sum: {
            points: true
          }
        });
        
        const customerPoints = currentPoints._sum.points || 0;
        if (customerPoints + calculatedPoints < 0) {
          return NextResponse.json({ 
            error: `Insufficient points. Customer has ${customerPoints} points, but refund requires ${Math.abs(calculatedPoints)} points.` 
          }, { status: 400 });
        }
      }

      // Get or create user record for the customer
      let user = await prisma.user.findUnique({
        where: { email: customer.email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: customer.email,
            name: customer.name,
            role: 'CUSTOMER',
            tenantId: userTenantId // Customer gets assigned to partner's tenant
          }
        });
      }

      // Create transaction under partner's business (tenantId = userTenantId)
      const transaction = await prisma.transaction.create({
        data: {
          amount: amount,
          points: calculatedPoints,
          type: transactionType,
          status: 'APPROVED',
          userId: user.id,
          customerId: customer.id,
          tenantId: userTenantId // Transaction recorded under partner's business
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Transaction created successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          points: transaction.points,
          type: transaction.type,
          status: transaction.status,
          createdAt: transaction.createdAt,
          customer: transaction.customer
        }
      });
    } else {
      // Original web request format - use tenantId from body or session for partners
      const finalTenantId = tenantId || (userRole === 'PARTNER' ? userTenantId : undefined);
      
      if (!amount || !customerId || !finalTenantId) {
        return NextResponse.json({ 
          error: 'Missing required fields: amount, customerId, or tenantId' 
        }, { status: 400 });
      }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: finalTenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get or create user record for the customer
    let user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name,
          role: 'CUSTOMER',
          tenantId: tenantId
        }
      });
    }

    // Determine if this is a refund (negative amount)
    const isRefund = amount < 0;
    const absoluteAmount = Math.abs(amount);
    
    // Calculate points based on absolute amount using tenant-specific config
    // For refunds, we'll negate the points
    let points = await calculatePointsForTransaction(absoluteAmount, finalTenantId);
    if (isRefund) {
      points = -points; // Make points negative for refunds
    }

    // Determine transaction type
    const transactionType = isRefund ? 'REFUND' : 'EARNED';

    // For refunds, verify customer has enough points
    if (isRefund) {
      const currentPoints = await prisma.transaction.aggregate({
        where: {
          customerId: customerId,
          status: { in: ['APPROVED', 'VOID'] }
        },
        _sum: {
          points: true
        }
      });
      
      const customerPoints = currentPoints._sum.points || 0;
      if (customerPoints + points < 0) {
        return NextResponse.json({ 
          error: `Insufficient points. Customer has ${customerPoints} points, but refund requires ${Math.abs(points)} points.` 
        }, { status: 400 });
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
        data: {
          amount: amount,
          points: points,
          type: transactionType,
          status: 'APPROVED',
          userId: user.id,
          customerId: customerId,
          tenantId: finalTenantId
        },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

      return NextResponse.json({
        message: 'Transaction created successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          points: transaction.points,
          type: transaction.type,
          status: transaction.status,
          createdAt: transaction.createdAt,
          customer: transaction.customer
        }
      });
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}