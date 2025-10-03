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

    const rewards = await prisma.reward.findMany({
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
    const { name, description, points, createdAt, tenantId } = body;

    // Validate required fields
    if (!name || !description || points === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and points are required' },
        { status: 400 }
      );
    }

    // Validate points is a positive number
    if (points < 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      );
    }

    // For admin users, tenantId is optional (can be null for LocalPerks rewards)
    let finalTenantId = tenantId;
    
    // Admins can create rewards for any tenant or for LocalPerks (System Default Tenant)
    if (!finalTenantId) {
      // Find or create the System Default Tenant for LocalPerks rewards
      let defaultTenant = await prisma.tenant.findFirst({
        where: { name: 'System Default Tenant' }
      });

      if (!defaultTenant) {
        // Create a system user first for the tenant
        const systemUser = await prisma.user.create({
          data: {
            email: 'system@localperks.com',
            name: 'LocalPerks System',
            role: 'ADMIN',
            suspended: false,
          }
        });

        defaultTenant = await prisma.tenant.create({
          data: {
            name: 'System Default Tenant',
            partnerUserId: systemUser.id,
          }
        });
      }
      finalTenantId = defaultTenant.id;
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        points: parseInt(points),
        tenantId: finalTenantId,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
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