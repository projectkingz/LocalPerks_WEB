import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists and is pending verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, approvalStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.approvalStatus !== 'PENDING_EMAIL_VERIFICATION') {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 400 }
      );
    }

    // Send new verification code
    const result = await generateAndSend2FACode({
      userId: user.id,
      method: 'email',
      email: email,
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Failed to send verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'Error sending verification code' },
      { status: 500 }
    );
  }
}
