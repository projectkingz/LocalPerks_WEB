import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { prisma } from '@/lib/prisma';

// Helper to check admin access
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }
  return session.user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // Get all users with calculated points using a more efficient query
  const users = await prisma.$queryRaw`
    SELECT 
      u.id, u.name, u.email, u.role, u.suspended, 
      u.approvalStatus, u.createdAt, u.updatedAt, 
      u.tenantId,
      t.name as businessName,
      COALESCE(CAST(earned_points.total_earned AS SIGNED), 0) - COALESCE(CAST(spent_points.total_spent AS SIGNED), 0) as points
    FROM User u 
    LEFT JOIN Tenant t ON u.id = t.partnerUserId
    LEFT JOIN (
      SELECT 
        userId,
        SUM(points) as total_earned
      FROM Transaction 
      WHERE type = 'EARNED' AND status = 'APPROVED'
      GROUP BY userId
    ) earned_points ON u.id = earned_points.userId
    LEFT JOIN (
      SELECT 
        c.email,
        SUM(r.points) as total_spent
      FROM Redemption r
      JOIN Customer c ON r.customerId = c.id
      GROUP BY c.email
    ) spent_points ON u.email = spent_points.email
    ORDER BY u.createdAt DESC
  `;

  // Get all customers and convert them to user-like format
  const customers = await prisma.customer.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true
        }
      },
      transactions: {
        where: {
          status: { in: ['APPROVED', 'VOID'] }
        }
      },
      redemptions: {
        include: {
          reward: {
            select: {
              points: true
            }
          }
        }
      }
    },
    // Include all customers, but handle invalid tenant IDs gracefully
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert customers to user-like format
  const customerUsers = customers.map((customer: any) => {
    const totalAmountSpent = customer.transactions
      .filter((t: any) => t.type === 'EARNED' && t.status === 'APPROVED')
      .reduce((sum: any, t: any) => sum + t.amount, 0);

    const totalPointsEarned = customer.transactions
      .filter((t: any) => t.type === 'EARNED' && t.status === 'APPROVED')
      .reduce((sum: any, t: any) => sum + t.points, 0);

    const totalPointsSpent = customer.redemptions
      .reduce((sum: any, r: any) => sum + r.reward.points, 0);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'CUSTOMER',
      suspended: false,
      approvalStatus: 'ACTIVE',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      tenantId: customer.tenantId,
      businessName: customer.tenant?.name || 'Multi-Tenant Customer',
      points: customer.points,
      totalAmountSpent,
      totalPointsEarned,
      totalPointsSpent
    };
  });
  
  // Convert BigInt values to numbers for JSON serialization and combine users and customers
  const serializedUsers = (users as any[]).map((user: any) => ({
    ...user,
    points: Number(user.points),
  }));

  // Combine users and customers, with customers first
  const allUsers = [...customerUsers, ...serializedUsers];
  
  return NextResponse.json(allUsers);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  // Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
  if ((data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  // Create user
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // Should be hashed in production!
        role: data.role,
        tenantId: data.tenantId || null,
        points: data.points || 0,
        emailVerified: new Date(),
      },
    });
    // Return user info except password
    const { password, ...userInfo } = user;
    return NextResponse.json(userInfo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
} 