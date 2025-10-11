import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { Twilio } from 'twilio';
import { prisma } from '@/lib/prisma';

// Initialize Redis with error handling
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis initialization failed:', error);
  redis = null;
}

// In-memory fallback for when Redis is unavailable
const memoryStore = new Map<string, { code: string; expires: number }>();

// Cleanup expired entries from memory store every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.expires) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Only initialize Twilio if credentials are properly set
let twilio: Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid' &&
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_AUTH_TOKEN !== 'your_auth_token') {
  try {
    twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('Twilio initialization failed:', error);
    twilio = null;
  }
}

const CODE_EXPIRY = 10 * 60; // 10 minutes in seconds
const CODE_LENGTH = 6;

export type TwoFactorMethod = 'email' | 'sms' | 'whatsapp';

interface TwoFactorOptions {
  userId: string;
  method: TwoFactorMethod;
  email?: string;
  phone?: string;
}

// Generate a random numeric code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store 2FA code in Redis or memory fallback
async function storeCode(userId: string, code: string): Promise<void> {
  const key = `2fa:${userId}`;
  const expires = Date.now() + (CODE_EXPIRY * 1000);
  
  try {
    if (redis) {
      await redis.set(key, code, { ex: CODE_EXPIRY });
    } else {
      // Fallback to in-memory storage
      memoryStore.set(key, { code, expires });
      console.log('Using in-memory fallback for 2FA code storage');
    }
  } catch (error) {
    console.warn('Failed to store code in Redis, using memory fallback:', error);
    memoryStore.set(key, { code, expires });
  }
}

// Send code via email
async function sendCodeViaEmail(email: string, code: string, name: string): Promise<boolean> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return false;
  }
  
  try {
    await resend.emails.send({
      from: 'Rewards App <noreply@rewards.example.com>',
      to: email,
      subject: 'Your Authentication Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two-Factor Authentication</h2>
          <p>Hi ${name},</p>
          <p>Your authentication code is:</p>
          <div style="
            text-align: center;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
          ">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    return false;
  }
}

// Send code via SMS
async function sendCodeViaSMS(phone: string, code: string): Promise<boolean> {
  try {
    if (!twilio) {
      console.error('Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
      return false;
    }
    
    if (!process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER === 'your_twilio_phone_number') {
      console.error('TWILIO_PHONE_NUMBER not configured in .env file.');
      return false;
    }

    await twilio.messages.create({
      body: `Your LocalPerks verification code is: ${code}. Valid for 10 minutes.`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return true;
  } catch (error) {
    console.error('Error sending 2FA SMS:', error);
    return false;
  }
}

// Send code via WhatsApp
async function sendCodeViaWhatsApp(phone: string, code: string): Promise<boolean> {
  try {
    if (!twilio) {
      console.error('Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
      return false;
    }
    
    // Format phone number for WhatsApp (remove + and add whatsapp: prefix)
    const whatsappNumber = phone.startsWith('+') ? phone.substring(1) : phone;
    const whatsappTo = `whatsapp:+${whatsappNumber}`;
    
    // Use Twilio WhatsApp sandbox number for testing
    // In production, you'd use your approved WhatsApp Business number
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    await twilio.messages.create({
      body: `Your LocalPerks verification code is: ${code}. Valid for 10 minutes.`,
      to: whatsappTo,
      from: whatsappFrom,
    });
    return true;
  } catch (error) {
    console.error('Error sending 2FA WhatsApp:', error);
    return false;
  }
}

// Generate and send 2FA code
export async function generateAndSend2FACode(options: TwoFactorOptions): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const { userId, method, email, phone } = options;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const code = generateCode();
    await storeCode(userId, code);

    if (method === 'email' && email) {
      const sent = await sendCodeViaEmail(email, code, user.name || 'User');
      if (!sent) {
        return {
          success: false,
          message: 'Failed to send code via email',
        };
      }
    } else if (method === 'sms' && phone) {
      const sent = await sendCodeViaSMS(phone, code);
      if (!sent) {
        return {
          success: false,
          message: 'Failed to send code via SMS - Twilio not configured',
        };
      }
    } else if (method === 'whatsapp' && phone) {
      const sent = await sendCodeViaWhatsApp(phone, code);
      if (!sent) {
        return {
          success: false,
          message: 'Failed to send code via WhatsApp - Twilio not configured',
        };
      }
    } else {
      return {
        success: false,
        message: 'Invalid 2FA method or missing contact information',
      };
    }

    return {
      success: true,
      message: `Code sent via ${method}`,
    };
  } catch (error) {
    console.error('Error generating 2FA code:', error);
    return {
      success: false,
      message: 'Failed to generate and send 2FA code',
    };
  }
}

// Verify 2FA code
export async function verify2FACode(userId: string, code: string): Promise<boolean> {
  try {
    const key = `2fa:${userId}`;
    let storedCode: string | null = null;
    
    if (redis) {
      try {
        storedCode = await redis.get<string>(key);
        if (storedCode === code) {
          await redis.del(key);
          return true;
        }
      } catch (error) {
        console.warn('Redis verification failed, trying memory fallback:', error);
      }
    }
    
    // Check memory fallback
    const memoryEntry = memoryStore.get(key);
    if (memoryEntry) {
      // Check if expired
      if (Date.now() > memoryEntry.expires) {
        memoryStore.delete(key);
        return false;
      }
      
      if (memoryEntry.code === code) {
        memoryStore.delete(key);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
}

// Check if user has pending 2FA verification
export async function hasPending2FAVerification(userId: string): Promise<boolean> {
  try {
    const key = `2fa:${userId}`;
    
    if (redis) {
      try {
        const exists = await redis.exists(key);
        return exists === 1;
      } catch (error) {
        console.warn('Redis status check failed, checking memory fallback:', error);
      }
    }
    
    // Check memory fallback
    const memoryEntry = memoryStore.get(key);
    if (memoryEntry) {
      // Check if expired
      if (Date.now() > memoryEntry.expires) {
        memoryStore.delete(key);
        return false;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
} 