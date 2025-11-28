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

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
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
    let updatedUser;
    if (user.role === 'CUSTOMER') {
      // For customers, activate account immediately after mobile verification
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          suspended: false,
          approvalStatus: 'ACTIVE',
        },
      });
      console.log(`✅ Mobile verified for customer: ${user.email}`);
      console.log(`   Status: ACTIVE (account activated)`);
    } else {
      // For partners, set to pending admin approval
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          approvalStatus: 'PENDING', // Partner accounts need admin approval
        },
      });
      console.log(`✅ Mobile verified for user: ${user.email}`);
      console.log(`   Status: PENDING (awaiting admin approval)`);
    }

    return NextResponse.json({
      success: true,
      message: user.role === 'CUSTOMER' 
        ? 'Mobile verified successfully. Your account is now active!'
        : 'Mobile verified successfully. Your account is pending admin approval.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus,
      },
    });
  } catch (error) {
    console.error('Error verifying mobile:', error);
    return NextResponse.json(
      { error: 'Failed to verify mobile' },
      { status: 500 }
    );
  }
}

