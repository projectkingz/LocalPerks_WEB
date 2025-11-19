import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (!user.tenant?.mobile) {
      return NextResponse.json(
        { error: 'Mobile number not found' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    whatsappCodeStore.set(userId, { code, expiresAt });

    // Send WhatsApp message with code
    const whatsappMessage = `*LocalPerks Mobile Verification*\n\nYour verification code is: *${code}*\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this message.`;
    const mobileNumber = user.tenant.mobile;

    // TODO: Implement actual WhatsApp sending service
    console.log(`\n📱 WhatsApp Message to ${mobileNumber}:`);
    console.log(`   Code: ${code}`);
    console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`   Message: ${whatsappMessage}`);

    // Simulate WhatsApp sending (in production, use Twilio, WhatsApp Business API, etc.)
    // await sendWhatsAppMessage(mobileNumber, whatsappMessage);

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

