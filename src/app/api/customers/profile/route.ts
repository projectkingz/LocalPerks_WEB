import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileJwt } from '@/lib/auth/mobile';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let email = session?.user?.email as string | undefined;
  
  // Fallback to mobile JWT if no NextAuth session (mobile clients)
  if (!email) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload?.email) {
      email = payload.email;
    }
  }
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, mobile } = body;

    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(name && { name }),
        ...(mobile && { mobile }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

