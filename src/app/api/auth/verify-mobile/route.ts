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

    // For partners, validate that the mobile number matches the one from registration
    if (user.role === 'PARTNER' && tenant) {
      const registeredMobile = tenant.mobile;
      
      // Normalize both numbers for comparison (remove spaces, dashes, etc.)
      const normalizeMobile = (num: string) => num.replace(/[\s\-\(\)]/g, '');
      const normalizedInput = normalizeMobile(mobile);
      const normalizedRegistered = registeredMobile ? normalizeMobile(registeredMobile) : '';
      
      if (!registeredMobile) {
        return NextResponse.json(
          { message: 'No mobile number found in registration. Please contact support.' },
          { status: 400 }
        );
      }
      
      // Check if the numbers match (allowing for different formats of the same number)
      const inputWithoutCountryCode = normalizedInput.replace(/^\+?44/, '').replace(/^0/, '');
      const registeredWithoutCountryCode = normalizedRegistered.replace(/^\+?44/, '').replace(/^0/, '');
      
      if (inputWithoutCountryCode !== registeredWithoutCountryCode) {
        return NextResponse.json(
          { 
            message: 'Mobile number does not match the number used during registration. Please enter the same mobile number you registered with.',
            registeredMobile: registeredMobile 
          },
          { status: 400 }
        );
      }
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

      // Update mobile number in tenant (for partners) and user status
      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { mobile: mobile },
        });
      }

      // Update user approval status (mobile verification complete)
      // For partners, set to PENDING for admin approval
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          approvalStatus: user.role === 'PARTNER' ? 'PENDING' : 'ACTIVE',
          // Keep suspended true for partners (admin must activate)
          suspended: user.role === 'PARTNER' ? true : false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          approvalStatus: true,
          suspended: true,
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
