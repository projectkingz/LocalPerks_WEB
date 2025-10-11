import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

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
      // Create user with hashed password first (unverified)
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'PARTNER',
          approvalStatus: 'PENDING_EMAIL_VERIFICATION', // Mark as pending email verification
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

    // Send email verification code
    let emailVerificationSent = false;
    try {
      const emailResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'email',
        email: email,
      });

      if (emailResult.success) {
        emailVerificationSent = true;
        console.log('Email verification sent successfully');
      } else {
        console.warn('Failed to send email verification:', emailResult.message);
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
    }

    return NextResponse.json(
      {
        message: emailVerificationSent 
          ? 'Registration successful. Please check your email for verification code.'
          : 'Registration successful. Please contact support for account activation.',
        requiresEmailVerification: emailVerificationSent,
        emailVerificationSent,
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