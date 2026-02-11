import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmailVerificationLink } from './mailtrap';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const VERIFICATION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

export async function sendVerificationEmail(email: string, name: string) {
  try {
    // Generate a verification token
    const token = crypto.randomBytes(32).toString('hex');
    const key = `verify:${email}`;

    // Store token with expiry
    await redis.set(key, token, { ex: VERIFICATION_EXPIRY });

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email using Mailtrap
    const success = await sendEmailVerificationLink(email, name, verificationUrl);
    
    if (!success) {
      return { success: false, error: 'Failed to send verification email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: 'Error sending verification email' };
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