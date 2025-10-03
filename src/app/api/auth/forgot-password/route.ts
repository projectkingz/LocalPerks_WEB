import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/auth/password-reset';
import { passwordResetRateLimit } from '@/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await passwordResetRateLimit(req);
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult;
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Send password reset email
    const success = await sendPasswordResetEmail(email);

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 