import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { businessName, name, email, password, mobile } = await req.json();

    // Validate input
    if (!businessName || !name || !email || !password || !mobile) {
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
      // Create user with hashed password first (suspended, pending verification)
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'PARTNER',
          suspended: false, // Account active immediately (authentication disabled)
          approvalStatus: 'PENDING_PAYMENT', // Mark as pending payment
        },
      });

      // Create tenant with the partner user
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          partnerUserId: user.id,
          mobile: mobile,
        } as any, // Temporary fix for type error if Prisma client is not up to date
      });

      // Update user with tenantId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return { tenant, user: updatedUser };
    });

    // Note: Email verification will be sent after payment completion in Step 2
    console.log(`\n Partner registration completed for: ${email}`);
    console.log(' Email verification will be sent after payment completion');

    return NextResponse.json(
      {
        message: 'Registration successful. Please proceed to payment to complete your account setup.',
        requiresEmailVerification: false,
        emailVerificationSent: false,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId,
          approvalStatus: result.user.approvalStatus,
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
