import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { validatePassword } from '../utils/password';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

export async function sendPasswordResetEmail(email: string) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return false;
  }
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const key = `reset:${email}`;

    // Store token with expiry
    await redis.set(key, token, { ex: RESET_TOKEN_EXPIRY });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await resend.emails.send({
      from: 'Rewards App <noreply@rewards.example.com>',
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            ${resetUrl}
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

export async function validateResetToken(email: string, token: string): Promise<boolean> {
  try {
    const key = `reset:${email}`;
    const storedToken = await redis.get<string>(key);

    return storedToken === token;
  } catch (error) {
    console.error('Error validating reset token:', error);
    return false;
  }
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join('. '),
      };
    }

    // Validate reset token
    const isValid = await validateResetToken(email, token);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete reset token
    const key = `reset:${email}`;
    await redis.del(key);

    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password',
    };
  }
} 