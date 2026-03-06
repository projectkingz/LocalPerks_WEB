import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
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

    let mobileNumber: string | null = null;
    
    if (user.role === 'CUSTOMER') {
      // Get customer mobile number
      const customer = await prisma.customer.findUnique({
        where: { email: user.email }
      });
      
      if (!customer || !customer.mobile) {
        return NextResponse.json(
          { error: 'Mobile number not found for customer' },
          { status: 400 }
        );
      }
      mobileNumber = customer.mobile;
    } else if (user.role === 'PARTNER') {
      // Get partner tenant mobile number
      if (!user.tenant?.mobile) {
        return NextResponse.json(
          { error: 'Mobile number not found for partner' },
          { status: 400 }
        );
      }
      mobileNumber = user.tenant.mobile;
    } else {
      return NextResponse.json(
        { error: 'Mobile verification is only available for customers and partners' },
        { status: 403 }
      );
    }

    // Use 2FA system for both customers and partners
    if (!mobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }
    
    const normalizedMobile = normalizePhoneNumber(mobileNumber);
    const result = await generateAndSend2FACode({
      userId: user.id,
      method: 'sms',
      phone: normalizedMobile,
      purpose: 'registration'
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to send verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent via SMS',
      mobileNumber: mobileNumber,
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending SMS verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS verification code' },
      { status: 500 }
    );
  }
}

