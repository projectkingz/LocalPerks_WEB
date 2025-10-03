import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resetPassword } from '@/lib/auth/password-reset';
import { passwordResetRateLimit } from '@/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await passwordResetRateLimit(req);
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult;
    }

    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await resetPassword(email, token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
} 