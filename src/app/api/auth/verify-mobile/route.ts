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

    // Check if user exists and get their tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        approvalStatus: true,
        role: true,
        partnerTenants: {
          select: { id: true, mobile: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // For partners, get their tenant
    const tenant = user.role === 'PARTNER' ? user.partnerTenants[0] : null;

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

      // Update mobile number in tenant (for partners) and user status
      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { mobile: mobile },
        });
      }

      // Update user approval status (mobile verification complete)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          // Mark as active since both email and mobile are verified
          approvalStatus: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
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
