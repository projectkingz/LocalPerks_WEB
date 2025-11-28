import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Missing userId or code' },
        { status: 400 }
      );
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify 2FA code for registration
    const isValidCode = await verify2FACode({
      userId: user.id,
      code: code,
      purpose: 'registration'
    });

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Update user based on role
    if (user.role === 'CUSTOMER') {
      // For customers, after email verification, move to mobile verification
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: new Date(),
          approvalStatus: 'PENDING_MOBILE_VERIFICATION',
          // Keep suspended until mobile is verified
        },
      });
    } else {
      // For partners, update to pending mobile verification
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: new Date(),
          approvalStatus: 'PENDING_MOBILE_VERIFICATION',
        },
      });
    }

    console.log(`✅ Email verified for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

