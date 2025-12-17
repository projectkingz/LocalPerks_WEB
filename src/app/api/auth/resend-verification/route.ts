import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

// In-memory store for verification codes (in production, use Redis)
interface VerificationCode {
  code: string;
  expiresAt: number;
}

const codeStore = new Map<string, VerificationCode>();

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

    // Use 2FA system for customers and partners
    let codeSent = false;
    try {
      if (user.role === 'CUSTOMER') {
        // Check if a code already exists for this user
        const { hasPending2FAVerification } = await import('@/lib/auth/two-factor');
        const hasPendingCode = await hasPending2FAVerification(user.id);
        
        if (hasPendingCode) {
          console.log('📧 Code already exists for customer, not sending duplicate');
          // Code already exists, don't send a new one
          return NextResponse.json({
            success: true,
            message: 'A verification code was already sent. Please check your email or wait before requesting a new one.',
            expiresIn: 600,
            codeAlreadyExists: true
          });
        }
        
        // For customers, use 2FA system
        const result = await generateAndSend2FACode({
          userId: user.id,
          method: 'email',
          email: user.email,
          purpose: 'registration'
        });
        codeSent = result.success;
      } else {
        // For partners, use legacy system (for backward compatibility)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        codeStore.set(userId, { code, expiresAt });
        
        console.log(`\n📧 Verification Email to ${email}:`);
        console.log(`   Code: ${code}`);
        console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);
        codeSent = true;
      }
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

// Export code store for verification
export function getVerificationCode(userId: string): string | null {
  const stored = codeStore.get(userId);
  if (!stored) return null;
  
  if (Date.now() > stored.expiresAt) {
    codeStore.delete(userId);
    return null;
  }
  
  return stored.code;
}

