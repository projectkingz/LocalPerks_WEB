import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    codeStore.set(userId, { code, expiresAt });

    // Send email with code (using your existing email service)
    const emailSubject = 'LocalPerks Email Verification';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; background-color: #eff6ff; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `;

    // TODO: Implement actual email sending service
    console.log(`\n📧 Verification Email to ${email}:`);
    console.log(`   Code: ${code}`);
    console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);

    // Simulate email sending (in production, use SendGrid, AWS SES, etc.)
    // await sendEmail(email, emailSubject, emailBody);

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

