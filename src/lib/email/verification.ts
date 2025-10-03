import { Resend } from 'resend';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const VERIFICATION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

export async function sendVerificationEmail(email: string, name: string) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    // Generate a verification token
    const token = crypto.randomBytes(32).toString('hex');
    const key = `verify:${email}`;

    // Store token with expiry
    await redis.set(key, token, { ex: VERIFICATION_EXPIRY });

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email using Resend
    await resend.emails.send({
      from: 'Rewards App <noreply@rewards.example.com>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Rewards App!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">Verify Email Address</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            ${verificationUrl}
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function verifyEmail(email: string, token: string): Promise<boolean> {
  try {
    const key = `verify:${email}`;
    const storedToken = await redis.get<string>(key);

    if (!storedToken || storedToken !== token) {
      return false;
    }

    // Delete the token after use
    await redis.del(key);

    // Update user's email verification status in the database
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return true;
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
} 