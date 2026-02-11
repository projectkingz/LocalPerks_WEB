import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    console.log('[resend-verification] Request received:', { userId, email });

    if (!userId || !email) {
      console.log('[resend-verification] Missing userId or email');
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // Fetch user from database
    console.log('[resend-verification] Looking up user with ID:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      console.error('[resend-verification] User not found with ID:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[resend-verification] User found:', { id: user.id, email: user.email, role: user.role });

    // Use 2FA system for both customers and partners
    let codeSent = false;
    try {
      // Check if a code already exists for this user
      const { hasPending2FAVerification } = await import('@/lib/auth/two-factor');
      const hasPendingCode = await hasPending2FAVerification(user.id);
      
      if (hasPendingCode) {
        console.log('📧 Code already exists for user, not sending duplicate');
        // Code already exists, don't send a new one
        return NextResponse.json({
          success: true,
          message: 'A verification code was already sent. Please check your email or wait before requesting a new one.',
          expiresIn: 600,
          codeAlreadyExists: true
        });
      }
      
      // Use 2FA system for both customers and partners
      const result = await generateAndSend2FACode({
        userId: user.id,
        method: 'email',
        email: user.email,
        purpose: 'registration'
      });
      codeSent = result.success;
    } catch (error) {
      console.error('Error sending verification code:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

