import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';
import { generateUniqueDisplayId } from '@/lib/customerId';

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
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user with suspended status pending email verification
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
          suspended: true,
          approvalStatus: 'PENDING_EMAIL_VERIFICATION',
        },
      });

      // Generate unique display ID
      const displayId = await generateUniqueDisplayId(tx as any);
      
      // Create customer with mobile number and display ID
      const customer = await tx.customer.create({
        data: {
          name: user.name || '',
          email: user.email,
          points: 0,
          tenantId: 'default', // You might want to make this configurable
          mobile: normalizedMobile,
          displayId: displayId,
        } as any,
      });

      return { user, customer };
    });

    // Send both email and WhatsApp verification codes
    let emailVerificationSent = false;
    let whatsappVerificationSent = false;
    
    // Send email verification code
    try {
      console.log('📧 Sending customer email verification code...');
      console.log(`📧 Sending email to: ${result.user.email}`);
      
      const emailResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'email',
        email: result.user.email,
        purpose: 'registration'
      });

      if (emailResult.success) {
        emailVerificationSent = true;
        console.log('✅ Customer email verification code sent successfully');
      } else {
        console.error('❌ Failed to send customer email verification code:', emailResult.message);
        // If email fails, rollback the transaction
        await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
        await prisma.customer.delete({ where: { id: result.customer.id } }).catch(() => {});
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
      console.error('❌ Error sending customer email verification code:', error);
      // Rollback on error
      await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
      await prisma.customer.delete({ where: { id: result.customer.id } }).catch(() => {});
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
      console.log('📱 Sending customer WhatsApp verification code...');
      console.log(`📱 Sending WhatsApp to: ${normalizedMobile}`);
      
      const whatsappResult = await generateAndSend2FACode({
        userId: result.user.id,
        method: 'whatsapp',
        phone: normalizedMobile,
        purpose: 'registration'
      });

      if (whatsappResult.success) {
        whatsappVerificationSent = true;
        console.log('✅ Customer WhatsApp verification code sent successfully');
      } else {
        console.error('❌ Failed to send customer WhatsApp verification code:', whatsappResult.message);
        // If WhatsApp fails, rollback the transaction
        await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
        await prisma.customer.delete({ where: { id: result.customer.id } }).catch(() => {});
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
      console.error('❌ Error sending customer WhatsApp verification code:', error);
      // Rollback on error
      await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
      await prisma.customer.delete({ where: { id: result.customer.id } }).catch(() => {});
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