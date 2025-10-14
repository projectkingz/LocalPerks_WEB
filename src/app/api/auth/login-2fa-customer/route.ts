import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json();

    // Validate input
    if (!email && !userId) {
      return NextResponse.json(
        { message: 'Email or userId is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Customer login 2FA request for:', email || userId);

    // Verify user exists and is a customer
    const user = await prisma.user.findUnique({
      where: email ? { email } : { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { message: '2FA is only available for customer accounts' },
        { status: 403 }
      );
    }

    // Get customer mobile number
    const customer = await prisma.customer.findUnique({
      where: { email: user.email },
      select: { mobile: true }
    });

    if (!customer || !customer.mobile) {
      return NextResponse.json(
        { message: 'Mobile number not found for this customer account' },
        { status: 400 }
      );
    }

    const mobile = normalizePhoneNumber(customer.mobile);
    console.log(`📱 Customer normalized mobile: ${customer.mobile} → ${mobile}`);

    // Send WhatsApp verification code
    let codeSent = false;
    try {
      console.log(`\n📤 Sending customer login 2FA WhatsApp to: ${mobile}`);
      const result = await generateAndSend2FACode({
        userId: user.id,
        method: 'whatsapp',
        phone: mobile,
        purpose: 'login' // Login purpose for customers
      });

      console.log(`\n📱 WhatsApp result:`, result);

      if (result.success) {
        codeSent = true;
        console.log('✅ Customer login 2FA WhatsApp sent successfully');
      } else {
        console.warn('⚠️  Failed to send customer login 2FA WhatsApp:', result.message);
        console.warn('💡 Check the console above for the verification code');
      }
    } catch (error) {
      console.error('❌ Error sending customer login 2FA WhatsApp:', error);
    }

    return NextResponse.json({
      message: codeSent 
        ? 'Verification code sent to your WhatsApp'
        : 'Failed to send verification code. Please try again.',
      codeSent,
      mobile: mobile.replace(/(\+44)(\d{3})(\d{3})(\d{4})/, '$1 $2***$4') // Mask mobile for privacy
    });

  } catch (error) {
    console.error('Customer login 2FA error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


