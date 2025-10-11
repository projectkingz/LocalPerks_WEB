import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, verify2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, mobile, code, action } = await req.json();

    if (!userId || !mobile) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mobile: true, approvalStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'send') {
      // Send WhatsApp verification code
      const result = await generateAndSend2FACode({
        userId: user.id,
        method: 'whatsapp',
        phone: mobile,
      });

      if (!result.success) {
        return NextResponse.json(
          { message: result.message || 'Failed to send verification code' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: 'Verification code sent to WhatsApp',
      });
    } else if (action === 'verify' && code) {
      // Verify the code
      const isValid = await verify2FACode(userId, code);

      if (!isValid) {
        return NextResponse.json(
          { message: 'Invalid or expired verification code' },
          { status: 400 }
        );
      }

      // Update user mobile and status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          mobile: mobile,
          // If email is already verified, mark as fully verified
          approvalStatus: user.approvalStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING_EMAIL_VERIFICATION'
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          tenantId: true,
          approvalStatus: true,
        },
      });

      return NextResponse.json({
        message: 'Mobile number verified successfully',
        user: updatedUser,
      });
    } else {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mobile verification error:', error);
    return NextResponse.json(
      { message: 'Error during mobile verification' },
      { status: 500 }
    );
  }
}
