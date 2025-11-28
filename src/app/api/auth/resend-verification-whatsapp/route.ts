import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndSend2FACode, normalizePhoneNumber } from '@/lib/auth/two-factor';

// In-memory store for WhatsApp codes
interface WhatsAppCode {
  code: string;
  expiresAt: number;
}

const whatsappCodeStore = new Map<string, WhatsAppCode>();

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

    let mobileNumber: string | null = null;
    
    if (user.role === 'CUSTOMER') {
      // Get customer mobile number
      const customer = await prisma.customer.findUnique({
        where: { email: user.email }
      });
      
      if (!customer || !customer.mobile) {
        return NextResponse.json(
          { error: 'Mobile number not found for customer' },
          { status: 400 }
        );
      }
      mobileNumber = customer.mobile;
    } else if (user.role === 'PARTNER') {
      // Get partner tenant mobile number
      if (!user.tenant?.mobile) {
        return NextResponse.json(
          { error: 'Mobile number not found for partner' },
          { status: 400 }
        );
      }
      mobileNumber = user.tenant.mobile;
    } else {
      return NextResponse.json(
        { error: 'Mobile verification is only available for customers and partners' },
        { status: 403 }
      );
    }

    // Use 2FA system for customers, legacy system for partners
    if (user.role === 'CUSTOMER') {
      // For customers, use 2FA system
      const normalizedMobile = normalizePhoneNumber(mobileNumber);
      const result = await generateAndSend2FACode({
        userId: user.id,
        method: 'whatsapp',
        phone: normalizedMobile,
        purpose: 'registration'
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message || 'Failed to send verification code' },
          { status: 500 }
        );
      }
    } else {
      // For partners, use legacy system (for backward compatibility)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      whatsappCodeStore.set(userId, { code, expiresAt });
      
      console.log(`\n📱 WhatsApp Message to ${mobileNumber}:`);
      console.log(`   Code: ${code}`);
      console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent via WhatsApp',
      mobileNumber: mobileNumber,
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending WhatsApp verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp verification code' },
      { status: 500 }
    );
  }
}

// Export code store for verification
export function getWhatsAppVerificationCode(userId: string): string | null {
  const stored = whatsappCodeStore.get(userId);
  if (!stored) return null;
  
  if (Date.now() > stored.expiresAt) {
    whatsappCodeStore.delete(userId);
    return null;
  }
  
  return stored.code;
}

