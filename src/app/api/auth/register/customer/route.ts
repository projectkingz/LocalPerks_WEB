import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password, mobile } = await req.json();

    // Validate input
    if (!name || !email || !password || !mobile) {
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

    // Create user and customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
        },
      });

      // Create customer (removed qrCode field as it doesn't exist in schema)
      const customer = await tx.customer.create({
        data: {
          name: user.name || '',
          email: user.email,
          points: 0,
          tenantId: 'default', // You might want to make this configurable
          mobile: mobile,
        } as any, // Temporary fix for type error if Prisma client is not up to date
      });

      return { user, customer };
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 