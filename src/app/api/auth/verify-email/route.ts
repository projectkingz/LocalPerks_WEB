import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    console.log(`\n🔍 Verifying email for user: ${userId} with code: ${code}`);

    if (!userId || !code) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the 2FA code
    let isValid = false;
    try {
      isValid = await verify2FACode({ userId, code, purpose: 'registration' });
      console.log(`✅ Code verification result: ${isValid}`);
    } catch (verifyError) {
      console.error('❌ Error during code verification:', verifyError);
      // Continue with isValid = false
    }

    if (!isValid) {
      console.warn('⚠️  Invalid or expired verification code');
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Update user status - both partners and customers move to mobile verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Both partners and customers require mobile verification after email
    const newApprovalStatus = 'PENDING_MOBILE_VERIFICATION';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: newApprovalStatus },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        approvalStatus: true,
      },
    });

    console.log(`✅ Email verified successfully for user: ${updatedUser.email} (${user?.role})`);
    console.log(`Next step: ${newApprovalStatus}`);

    return NextResponse.json({
      message: 'Email verified successfully',
      user: updatedUser,
      requiresMobileVerification: true,
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json(
      { message: 'Error during email verification' },
      { status: 500 }
    );
  }
}
