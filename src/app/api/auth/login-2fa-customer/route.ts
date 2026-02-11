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

    // Send verification code via WhatsApp only (no email fallback for login)
    let codeSent = false;
    let deliveryMethod = 'whatsapp';
    
    // Require mobile number for login 2FA
    if (!customer || !customer.mobile) {
      console.error('❌ No mobile number found for customer:', user.id);
      return NextResponse.json(
        { 
          message: 'Mobile number is required for login verification. Please ensure your account has a mobile number.',
          codeSent: false
        },
        { status: 400 }
      );
    }
    
    const normalizedMobile = normalizePhoneNumber(customer.mobile);
    console.log(`📱 Customer normalized mobile: ${customer.mobile} → ${normalizedMobile}`);
    
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📤 Sending customer login 2FA WhatsApp to: ${normalizedMobile}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      const whatsappResult = await generateAndSend2FACode({
        userId: user.id,
        method: 'whatsapp',
        phone: normalizedMobile,
        purpose: 'login'
      });

      console.log(`\n📱 WhatsApp/SMS result:`, whatsappResult);

      if (whatsappResult.success) {
        codeSent = true;
        deliveryMethod = 'whatsapp';
        console.log('✅ Customer login 2FA code sent successfully via WhatsApp (or SMS fallback)');
      } else {
        console.error('❌ Failed to send customer login 2FA via WhatsApp/SMS:', whatsappResult.message);
        return NextResponse.json(
          { 
            message: 'Failed to send verification code via WhatsApp. Please try again or contact support.',
            codeSent: false
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('❌ Error sending customer login 2FA WhatsApp:', error);
      return NextResponse.json(
        { 
          message: 'Error sending verification code. Please try again or contact support.',
          codeSent: false
        },
        { status: 500 }
      );
    }

    const maskedContact = customer.mobile.replace(/(\+44)(\d{3})(\d{3})(\d{4})/, '$1 $2***$4');

    return NextResponse.json({
      message: codeSent 
        ? `Verification code sent to your WhatsApp`
        : 'Failed to send verification code. Please try again.',
      codeSent,
      method: deliveryMethod,
      contact: maskedContact
    });

  } catch (error) {
    console.error('Customer login 2FA error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}







