import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    // Validate input
    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔐 Verifying login 2FA for user:', userId);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerTenants: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'PARTNER' && user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: '2FA is only available for partner and customer accounts' },
        { status: 403 }
      );
    }

    // Check if user is suspended or needs approval
    const isSuspended = Boolean(user.suspended);
    if (isSuspended) {
      if (user.approvalStatus === 'PENDING_EMAIL_VERIFICATION') {
        return NextResponse.json(
          { error: 'PARTNER_EMAIL_VERIFICATION_REQUIRED' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'PENDING_MOBILE_VERIFICATION') {
        return NextResponse.json(
          { error: 'PARTNER_MOBILE_VERIFICATION_REQUIRED' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'ACCOUNT_UNDER_REVIEW' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'PENDING') {
        return NextResponse.json(
          { error: 'PENDING_APPROVAL' },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: 'ACCOUNT_SUSPENDED' },
          { status: 401 }
        );
      }
    }

    // Verify 2FA code
    console.log('🔑 Verifying 2FA code...');
    const isValidCode = await verify2FACode({
      userId: user.id,
      code: code,
      purpose: 'login'
    });

    if (!isValidCode) {
      console.log('❌ Invalid or expired code');
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    console.log('✅ 2FA verification successful!');

    // Return success - the frontend will handle the actual sign-in
    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Verify login 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
