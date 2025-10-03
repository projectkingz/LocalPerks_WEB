import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, tenantId } = body;

    if (!name || !email || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create customer using raw query to avoid Prisma schema issues
    await prisma.$executeRaw`
      INSERT INTO "Customer" (id, name, email, phone, "tenantId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${email}, ${phone || null}, ${tenantId}, NOW(), NOW())
    `;

    return NextResponse.json({ 
      message: 'Customer created successfully',
      customer: { name, email, phone, tenantId }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
} 