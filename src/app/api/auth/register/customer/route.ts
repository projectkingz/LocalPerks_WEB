import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { name, email, password, mobile } = await req.json();

    // Validate input
    if (!name || !email || !password || !mobile) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedMobile = normalizePhoneNumber(mobile);
    console.log('📱 Customer mobile normalized:', mobile, '→', normalizedMobile);

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user and customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with suspended status pending mobile verification
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
          suspended: true,
          approvalStatus: 'PENDING_MOBILE_VERIFICATION',
        },
      });

      // Create customer with mobile number
      const customer = await tx.customer.create({
        data: {
          name: user.name || '',
          email: user.email,
          points: 0,
          tenantId: 'default', // You might want to make this configurable
          mobile: normalizedMobile,
        } as any,
      });

      return { user, customer };
    });

    // Send mobile verification code via WhatsApp
    let verificationSent = false;
    try {
      console.log('📤 Sending customer mobile verification code...');
      const sendResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'whatsapp',
        phone: normalizedMobile,
        purpose: 'registration'
      });

      if (sendResult.success) {
        verificationSent = true;
        console.log('✅ Customer verification code sent successfully');
      } else {
        console.warn('⚠️  Failed to send customer verification code:', sendResult.message);
      }
    } catch (error) {
      console.error('❌ Error sending customer verification code:', error);
    }

    return NextResponse.json(
      {
        message: verificationSent 
          ? 'Registration successful. Please verify your mobile number.'
          : 'Registration successful but verification code could not be sent. Please try again.',
        requiresMobileVerification: true,
        mobileVerificationSent: verificationSent,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 