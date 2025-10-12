import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { email, userId, mobile } = await req.json();

    // Validate input
    if (!email || !userId || !mobile) {
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

    // Get tenant mobile number
    const tenant = user.partnerTenants[0]?.tenant;
    if (!tenant || !tenant.mobile) {
      return NextResponse.json(
        { message: 'Mobile number not found for this partner account' },
        { status: 400 }
      );
    }

    // Verify mobile number matches
    if (tenant.mobile !== mobile) {
      return NextResponse.json(
        { message: 'Mobile number mismatch' },
        { status: 400 }
      );
    }

    // Send WhatsApp verification code
    let codeSent = false;
    try {
      console.log(`\n📤 Sending login 2FA WhatsApp to: ${mobile}`);
      const result = await generateAndSend2FACode({
        userId: user.id,
        method: 'whatsapp',
        mobile: mobile,
        purpose: 'login' // Add purpose to distinguish from registration 2FA
      });

      console.log(`\n📱 WhatsApp result:`, result);

      if (result.success) {
        codeSent = true;
        console.log('✅ Login 2FA WhatsApp sent successfully');
      } else {
        console.warn('⚠️  Failed to send login 2FA WhatsApp:', result.message);
        console.warn('💡 Check the console above for the verification code');
      }
    } catch (error) {
      console.error('❌ Error sending login 2FA WhatsApp:', error);
    }

    return NextResponse.json({
      message: codeSent 
        ? 'Verification code sent to your WhatsApp'
        : 'Failed to send verification code. Please try again.',
      codeSent,
      mobile: mobile.replace(/(\+44)(\d{3})(\d{3})(\d{4})/, '$1 $2***$4') // Mask mobile for privacy
    });

  } catch (error) {
    console.error('Login 2FA error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
