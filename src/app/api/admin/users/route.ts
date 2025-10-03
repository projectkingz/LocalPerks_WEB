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
      u."approvalStatus", u."createdAt", u."updatedAt", 
      u."tenantId",
      COALESCE(CAST(earned_points.total_earned AS INTEGER), 0) - COALESCE(CAST(spent_points.total_spent AS INTEGER), 0) as points
    FROM "User" u 
    LEFT JOIN (
      SELECT 
        "userId",
        SUM(points) as total_earned
      FROM "Transaction" 
      WHERE type = 'EARNED' AND status = 'APPROVED'
      GROUP BY "userId"
    ) earned_points ON u.id = earned_points."userId"
    LEFT JOIN (
      SELECT 
        c.email,
        SUM(r.points) as total_spent
      FROM "Redemption" r
      JOIN "Customer" c ON r."customerId" = c.id
      GROUP BY c.email
    ) spent_points ON u.email = spent_points.email
    ORDER BY u."createdAt" DESC
  `;
  
  return NextResponse.json(users);
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