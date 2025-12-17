import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

// Import or redefine the Reward interface and rewardsDatabase
interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  createdAt: string;
}

// Use a global variable to persist rewards across requests (for dev only)
let globalAny = global as any;
if (!globalAny.rewardsDatabase) {
  globalAny.rewardsDatabase = {
    '1': {
      id: '1',
      name: 'Free Coffee',
      description: 'Get a free coffee with 100 points',
      points: 100,
      createdAt: new Date().toISOString(),
    },
    '2': {
      id: '2',
      name: 'Discounted Lunch',
      description: '50% off your next lunch',
      points: 200,
      createdAt: new Date().toISOString(),
    },
  };
}
const rewardsDatabase: { [key: string]: Reward } = globalAny.rewardsDatabase;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Build tenant filter based on user role
    let whereClause = {};
    
    if (session.user.role === 'PARTNER' && session.user.tenantId) {
      // Partners only see their own rewards (all statuses)
      whereClause = { tenantId: session.user.tenantId };
    } else if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
      // Admins see all rewards (all statuses)
    } else {
      // Customers only see approved rewards from all tenants
      whereClause = { approvalStatus: 'APPROVED' };
    }
    
    // Fetch rewards from database with tenant filtering and include tenant info
    const rewards = await prisma.reward.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Rewards API: Error in GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only partners and admins can create rewards
    if (!['PARTNER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, points, tenantId: requestTenantId } = body;
    
    if (!name || !description || points === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    
    // Set tenantId based on user role
    let tenantId = null;
    if (session.user.role === 'PARTNER') {
      if (!session.user.tenantId) {
        return NextResponse.json({ error: 'Partner has no tenant assigned' }, { status: 400 });
      }
      tenantId = session.user.tenantId;
    } else {
      // For admins, tenantId is optional (can be null for LocalPerks rewards)
      if (!requestTenantId) {
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
        tenantId = defaultTenant.id;
      } else {
        tenantId = requestTenantId;
      }
    }
    
    // Set approval status based on user role
    let approvalStatus = 'PENDING';
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
      approvalStatus = 'APPROVED';
    }

    const reward = await prisma.reward.create({
      data: { 
        name, 
        description, 
        points: Number(points),
        tenantId: tenantId,
        approvalStatus: approvalStatus,
        approvedAt: approvalStatus === 'APPROVED' ? new Date() : null,
        approvedBy: approvalStatus === 'APPROVED' ? session.user.id : null
      },
    });
    
    return NextResponse.json({ message: 'Reward created successfully', reward });
  } catch (error) {
    console.error('Rewards API: Error in POST:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 