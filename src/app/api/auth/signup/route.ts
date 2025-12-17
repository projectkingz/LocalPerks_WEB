import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateUniqueDisplayId } from '@/lib/customerId';

export async function POST(req: Request) {
  try {
    const { email, password, name, tenantId } = await req.json();

    if (!email || !password || !name || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user and customer in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'CUSTOMER',
          tenantId
        }
      });

      // Generate unique display ID
      const displayId = await generateUniqueDisplayId(tx as any);
      
      // Create customer record (using correct schema fields)
      const customer = await tx.customer.create({
        data: {
          name: user.name || '',
          email: user.email,
          mobile: '000-000-0000', // Default mobile for new users
          points: 0,
          tenantId: user.tenantId || tenantId,
          displayId: displayId,
        }
      });

      return { user, customer };
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: result.user,
        customer: result.customer
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error during signup' },
      { status: 500 }
    );
  }
} 