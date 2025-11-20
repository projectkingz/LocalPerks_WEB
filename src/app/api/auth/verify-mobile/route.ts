import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWhatsAppVerificationCode } from '../resend-verification-whatsapp/route';

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
    const storedCode = getWhatsAppVerificationCode(userId);

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

    // Update user to pending admin approval
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'PENDING', // Partner accounts need admin approval
      },
    });

    console.log(`✅ Mobile verified for user: ${user.email}`);
    console.log(`   Status: PENDING (awaiting admin approval)`);

    return NextResponse.json({
      success: true,
      message: 'Mobile verified successfully. Your account is pending admin approval.',
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

