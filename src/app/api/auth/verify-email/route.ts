import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerificationCode } from '../resend-verification/route';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Missing userId or code' },
        { status: 400 }
      );
    }

    // Get stored code
    const storedCode = getVerificationCode(userId);

    if (!storedCode) {
      return NextResponse.json(
        { error: 'No verification code found or code expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify code
    if (storedCode !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Update user email verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user to pending mobile verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        approvalStatus: 'PENDING_MOBILE_VERIFICATION',
      },
    });

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

