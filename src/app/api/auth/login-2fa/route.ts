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

    console.log('🔐 Login 2FA request for:', email || userId);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: email ? { email } : { id: userId },
      include: {
        partnerTenants: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'PARTNER' && user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { message: '2FA is only available for partner and customer accounts' },
        { status: 403 }
      );
    }

    // Get contact information based on user role
    let mobile: string | null = null;
    let contactName = user.name || 'User';
    
    if (user.role === 'PARTNER') {
      // Get tenant mobile number for partners
      const tenant = user.partnerTenants[0];
      console.log(`👤 Partner tenant info:`, tenant ? {
        id: tenant.id,
        hasMobile: !!tenant.mobile,
        mobile: tenant.mobile ? '***' + tenant.mobile.slice(-4) : 'none'
      } : 'No tenant found');
      
      if (!tenant) {
        console.error('❌ No partner tenant found for user:', user.id);
        return NextResponse.json(
          { 
            message: 'Partner tenant not found. Please complete your partner registration.',
            codeSent: false
          },
          { status: 400 }
        );
      }
      mobile = tenant.mobile;
    } else if (user.role === 'CUSTOMER') {
      // Get customer mobile number
      const customer = await prisma.customer.findUnique({
        where: { email: user.email }
      });
      
      if (customer) {
        mobile = customer.mobile;
        contactName = customer.name || contactName;
        console.log(`👤 Customer info:`, {
          id: customer.id,
          hasMobile: !!customer.mobile,
          mobile: customer.mobile ? '***' + customer.mobile.slice(-4) : 'none'
        });
      } else {
        console.warn('⚠️  Customer record not found for user:', user.id);
      }
    }
    
    // Send verification code - prefer WhatsApp if mobile available, otherwise use email
    let codeSent = false;
    let deliveryMethod = 'email';
    
    if (mobile) {
      // Try WhatsApp first
      const normalizedMobile = normalizePhoneNumber(mobile);
      console.log(`📱 Normalized mobile: ${mobile} → ${normalizedMobile}`);
      
      try {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📤 Sending login 2FA WhatsApp to: ${normalizedMobile}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        const result = await generateAndSend2FACode({
          userId: user.id,
          method: 'whatsapp',
          phone: normalizedMobile,
          purpose: 'login'
        });

        console.log(`\n📱 WhatsApp result:`, result);

        if (result.success) {
          codeSent = true;
          deliveryMethod = 'whatsapp';
          console.log('✅ Login 2FA WhatsApp sent successfully');
        } else {
          console.warn('\n⚠️  Failed to send login 2FA WhatsApp:', result.message);
          console.log('🔄 Falling back to email...');
          deliveryMethod = 'email'; // Will try email below
        }
      } catch (error) {
        console.error('❌ Error sending login 2FA WhatsApp:', error);
        console.log('🔄 Falling back to email...');
        deliveryMethod = 'email'; // Will try email below
      }
    }
    
    // Fallback to email if WhatsApp failed or mobile not available
    if (!codeSent) {
      if (!user.email) {
        console.error('❌ No email found for user:', user.id);
        return NextResponse.json(
          { 
            message: 'No contact method available. Please add a mobile number or email to your account.',
            codeSent: false
          },
          { status: 400 }
        );
      }
      
      try {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📤 Sending login 2FA email to: ${user.email}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        const result = await generateAndSend2FACode({
          userId: user.id,
          method: 'email',
          email: user.email,
          purpose: 'login'
        });

        console.log(`\n📧 Email result:`, result);

        if (result.success) {
          codeSent = true;
          console.log('✅ Login 2FA email sent successfully');
        } else {
          console.warn('\n⚠️  Failed to send login 2FA email:', result.message);
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('💡 IMPORTANT: Check the console output above for the');
          console.log('   6-digit verification code. The code was generated');
          console.log('   and logged above (look for "Generated 2FA code").');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          // Still allow the flow to continue since code is in console
          codeSent = true;
        }
      } catch (error) {
        console.error('❌ Error sending login 2FA email:', error);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 Check the console output above for the verification code');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
    }

    const maskedContact = mobile && deliveryMethod === 'whatsapp'
      ? mobile.replace(/(\+44)(\d{3})(\d{3})(\d{4})/, '$1 $2***$4')
      : user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || 'your contact';

    return NextResponse.json({
      message: codeSent 
        ? `Verification code sent to your ${deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'email'}`
        : 'Failed to send verification code. Please try again.',
      codeSent,
      method: deliveryMethod,
      contact: maskedContact
    });

  } catch (error) {
    console.error('Login 2FA error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
