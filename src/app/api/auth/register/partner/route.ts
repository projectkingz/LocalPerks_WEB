import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { businessName, name, email, password, mobile } = await req.json();

    // Validate input
    if (!businessName || !name || !email || !password || !mobile) {
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

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Normalize phone number
    const normalizedMobile = normalizePhoneNumber(mobile);
    console.log('📱 Partner mobile normalized:', mobile, '→', normalizedMobile);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user with hashed password first (suspended, pending email verification)
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'PARTNER',
          suspended: true, // Suspended until email verification
          approvalStatus: 'PENDING_EMAIL_VERIFICATION', // Mark as pending email verification
        },
      });

      // Create tenant with the partner user
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          partnerUserId: user.id,
          mobile: normalizedMobile,
        } as any, // Temporary fix for type error if Prisma client is not up to date
      });

      // Update user with tenantId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return { tenant, user: updatedUser };
    });

    // Send both email and WhatsApp verification codes
    let emailVerificationSent = false;
    let whatsappVerificationSent = false;
    
    // Send email verification code
    try {
      console.log('📧 Sending partner email verification code...');
      console.log(`📧 Sending email to: ${result.user.email}`);
      
      const emailResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'email',
        email: result.user.email,
        purpose: 'registration'
      });

      if (emailResult.success) {
        emailVerificationSent = true;
        console.log('✅ Partner email verification code sent successfully');
      } else {
        console.error('❌ Failed to send partner email verification code:', emailResult.message);
        // If email fails, rollback the transaction
        await prisma.tenant.delete({ where: { id: result.tenant.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
        return NextResponse.json(
          { 
            message: 'Registration failed: Could not send email verification code. Please ensure your email address is correct and try again.',
            requiresEmailVerification: false,
            emailVerificationSent: false,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('❌ Error sending partner email verification code:', error);
      // Rollback on error
      await prisma.tenant.delete({ where: { id: result.tenant.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
      return NextResponse.json(
        { 
          message: 'Registration failed: Could not send email verification code. Please try again.',
          requiresEmailVerification: false,
          emailVerificationSent: false,
        },
        { status: 500 }
      );
    }

    // Send WhatsApp verification code
    try {
      console.log('📱 Sending partner WhatsApp verification code...');
      console.log(`📱 Sending WhatsApp to: ${normalizedMobile}`);
      
      const whatsappResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'whatsapp',
        phone: normalizedMobile,
        purpose: 'registration'
      });

      if (whatsappResult.success) {
        whatsappVerificationSent = true;
        console.log('✅ Partner WhatsApp verification code sent successfully');
      } else {
        console.error('❌ Failed to send partner WhatsApp verification code:', whatsappResult.message);
        // If WhatsApp fails, rollback the transaction
        await prisma.tenant.delete({ where: { id: result.tenant.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
        return NextResponse.json(
          { 
            message: 'Registration failed: Could not send WhatsApp verification code. Please ensure your mobile number is correct and try again.',
            requiresMobileVerification: false,
            whatsappVerificationSent: false,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('❌ Error sending partner WhatsApp verification code:', error);
      // Rollback on error
      await prisma.tenant.delete({ where: { id: result.tenant.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
      return NextResponse.json(
        { 
          message: 'Registration failed: Could not send WhatsApp verification code. Please try again.',
          requiresMobileVerification: false,
          whatsappVerificationSent: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email and WhatsApp for verification codes.',
        requiresEmailVerification: true,
        requiresMobileVerification: true,
        emailVerificationSent: emailVerificationSent,
        whatsappVerificationSent: whatsappVerificationSent,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId,
          approvalStatus: result.user.approvalStatus,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Error during registration' },
      { status: 500 }
    );
  }
}
