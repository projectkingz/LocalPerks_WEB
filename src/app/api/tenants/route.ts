import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock database - In a real app, this would be your database
interface Tenant {
  id: string;
  name: string;
  email: string;
  pointsMultiplier: number;  // How many points per pound this tenant awards
  createdAt: string;
}

let tenantsDatabase: { [key: string]: Tenant } = {};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        partnerUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            customers: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, partnerEmail } = await request.json();

    if (!name || !partnerEmail) {
      return NextResponse.json({ error: 'Name and partner email are required' }, { status: 400 });
    }

    // Check if partner user exists
    const partnerUser = await prisma.user.findUnique({
      where: { email: partnerEmail },
    });

    if (!partnerUser) {
      return NextResponse.json({ error: 'Partner user not found' }, { status: 404 });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        partnerUserId: partnerUser.id,
      },
      include: {
        partnerUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
} 