import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FACode } from '@/lib/auth/two-factor';
import { signToken } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  try {
    const { email, userId, code } = await req.json();

    // Validate input
    if (!email || !userId || !code) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists and is a partner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerTenants: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.email !== email) {
      return NextResponse.json(
        { message: 'Email mismatch' },
        { status: 400 }
      );
    }

    if (user.role !== 'PARTNER') {
      return NextResponse.json(
        { message: '2FA is only available for partner accounts' },
        { status: 403 }
      );
    }

    // Check if user is suspended or needs approval
    if (user.suspended) {
      if (user.approvalStatus === 'PENDING_EMAIL_VERIFICATION') {
        return NextResponse.json(
          { message: 'PARTNER_EMAIL_VERIFICATION_REQUIRED' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'PENDING_MOBILE_VERIFICATION') {
        return NextResponse.json(
          { message: 'PARTNER_MOBILE_VERIFICATION_REQUIRED' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'UNDER_REVIEW') {
        return NextResponse.json(
          { message: 'ACCOUNT_UNDER_REVIEW' },
          { status: 401 }
        );
      } else if (user.approvalStatus === 'PENDING') {
        return NextResponse.json(
          { message: 'PENDING_APPROVAL' },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { message: 'ACCOUNT_SUSPENDED' },
          { status: 401 }
        );
      }
    }

    // Verify 2FA code
    const isValidCode = await verify2FACode({
      userId: user.id,
      code: code,
      purpose: 'login'
    });

    if (!isValidCode) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Generate session token
    const sessionToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    // Return user data and token
    return NextResponse.json({
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        points: user.points,
        tier: user.tier,
        suspended: user.suspended,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('Verify login 2FA error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
