import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { businessName, name, email, password } = await req.json();

    // Validate input
    if (!businessName || !name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with hashed password first
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'PARTNER',
        },
      });

      // Create tenant with the partner user
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          partnerUserId: user.id,
        },
      });

      // Update user with tenantId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return { tenant, user: updatedUser };
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Error during registration' },
      { status: 500 }
    );
  }
} 