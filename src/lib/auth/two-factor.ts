import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { Twilio } from 'twilio';
import { prisma } from '@/lib/prisma';

// Initialize Redis with error handling
let redis: Redis | null = null;
let redisConnectionFailed = false;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    // Test connection asynchronously (don't block initialization)
    redis.ping().catch((error) => {
      console.warn('Redis connection test failed, will use memory fallback:', error.message || error);
      redisConnectionFailed = true;
      redis = null;
    });
  }
} catch (error) {
  console.warn('Redis initialization failed:', error);
  redisConnectionFailed = true;
  redis = null;
}

// In-memory fallback for when Redis is unavailable
// Use global to persist across module reloads in development
declare global {
  var __2fa_memory_store__: Map<string, { code: string; expires: number }> | undefined;
  var __2fa_cleanup_interval__: NodeJS.Timeout | undefined;
}

const memoryStore = global.__2fa_memory_store__ ?? new Map<string, { code: string; expires: number }>();
if (!global.__2fa_memory_store__) {
  global.__2fa_memory_store__ = memoryStore;
  console.log('🆕 Created new global memory store for 2FA codes');
} else {
  console.log('♻️  Reusing existing global memory store for 2FA codes');
}

// Cleanup expired entries from memory store every 5 minutes
// Only set up interval once
if (!global.__2fa_cleanup_interval__) {
  global.__2fa_cleanup_interval__ = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.expires) {
        memoryStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired 2FA codes`);
    }
  }, 5 * 60 * 1000) as any; // 5 minutes
}

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
  purpose?: string; // 'registration' or 'login'
}

// Generate a random numeric code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store 2FA code in Redis or memory fallback
async function storeCode(userId: string, code: string, purpose: string = 'registration'): Promise<void> {
  const key = `2fa:${userId}:${purpose}`;
  const expires = Date.now() + (CODE_EXPIRY * 1000);
  
  console.log(`\n💾 Storing code for key: ${key}`);
  console.log(`📝 Code: ${code}`);
  console.log(`⏰ Expires: ${new Date(expires)}`);
  
  try {
    if (redis && !redisConnectionFailed) {
      console.log('🔄 Attempting to store in Redis...');
      await redis.set(key, code, { ex: CODE_EXPIRY });
      console.log('✅ Code stored in Redis');
    } else {
      // Fallback to in-memory storage
      memoryStore.set(key, { code, expires });
      console.log('✅ Using in-memory fallback for 2FA code storage');
      console.log(`📊 Memory store now has ${memoryStore.size} entries`);
    }
  } catch (error) {
    console.warn('⚠️  Failed to store code in Redis, using memory fallback');
    redisConnectionFailed = true;
    redis = null;
    memoryStore.set(key, { code, expires });
    console.log('✅ Code stored in memory fallback');
    console.log(`📊 Memory store now has ${memoryStore.size} entries`);
  }
  
  // Verify it was stored
  const stored = memoryStore.get(key);
  if (stored) {
    console.log(`✅ Verified: Code is in memory store`);
  } else if (!redis) {
    console.error('❌ ERROR: Code was NOT stored in memory!');
  }
}

// Send code via email
async function sendCodeViaEmail(email: string, code: string, name: string): Promise<boolean> {
  if (!resend) {
    console.warn('⚠️  Resend API key not configured, skipping email send');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 VERIFICATION CODE (DEVELOPMENT MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
  
  try {
    await resend.emails.send({
      from: 'LocalPerks <onboarding@resend.dev>', // Use Resend's test domain
      to: email,
      subject: 'Your LocalPerks Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hi ${name},</p>
          <p>Your verification code is:</p>
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
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending 2FA email:', error);
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

// Normalize phone number to E.164 format
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  console.log(`📞 Original phone: ${phone}`);
  
  // If it starts with 0, assume it's a UK number (remove leading 0 and add +44)
  if (normalized.startsWith('0')) {
    normalized = '+44' + normalized.substring(1);
    console.log(`🇬🇧 Detected UK number, converted to: ${normalized}`);
  }
  // If it doesn't start with +, add +44 (UK default)
  else if (!normalized.startsWith('+')) {
    normalized = '+44' + normalized;
    console.log(`🇬🇧 Added UK country code: ${normalized}`);
  }
  // If it starts with +0, it's invalid - fix it
  else if (normalized.startsWith('+0')) {
    normalized = '+44' + normalized.substring(2);
    console.log(`🔧 Fixed invalid +0 prefix to: ${normalized}`);
  }
  
  console.log(`✅ Normalized phone: ${normalized}`);
  return normalized;
}

// Send code via WhatsApp
async function sendCodeViaWhatsApp(phone: string, code: string): Promise<boolean> {
  try {
    if (!twilio) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  Twilio not configured - WhatsApp code NOT sent');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📱 WhatsApp would be sent to: ${phone}`);
      console.log(`🔑 VERIFICATION CODE: ${code}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      // Return true to allow flow to continue - code is in console
      return true;
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Format phone number for WhatsApp (add whatsapp: prefix)
    const whatsappTo = `whatsapp:${normalizedPhone}`;
    
    // Use Twilio WhatsApp sandbox number for testing
    // In production, you'd use your approved WhatsApp Business number
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    console.log(`📤 Sending WhatsApp to: ${whatsappTo}`);
    
    await twilio.messages.create({
      body: `Your LocalPerks verification code is: ${code}. Valid for 10 minutes.`,
      to: whatsappTo,
      from: whatsappFrom,
    });
    
    console.log(`✅ WhatsApp sent successfully to ${normalizedPhone}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending 2FA WhatsApp:', error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 WHATSAPP CODE (DEVELOPMENT MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Phone: ${phone}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    // Return true so the flow continues (code is available in console)
    return true;
  }
}

// Generate and send 2FA code
export async function generateAndSend2FACode(options: TwoFactorOptions): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const { userId, method, email, phone, purpose = 'registration' } = options;

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
    await storeCode(userId, code, purpose);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔐 GENERATED 2FA CODE`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`User ID: ${userId}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`Code: ${code}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (method === 'email' && email) {
      const sent = await sendCodeViaEmail(email, code, user.name || 'User');
      if (!sent) {
        console.log(`\n⚠️  IMPORTANT: Email not configured. Use this code for verification: ${code}\n`);
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
export async function verify2FACode(options: { userId: string; code: string; purpose?: string }): Promise<boolean> {
  try {
    const { userId, code, purpose = 'registration' } = options;
    const key = `2fa:${userId}:${purpose}`;
    let storedCode: string | null = null;
    
    console.log(`\n🔑 Verifying 2FA code for key: ${key}`);
    console.log(`📝 Provided code: ${code}`);
    console.log(`💾 Redis available: ${redis ? 'Yes' : 'No'}`);
    console.log(`💾 Memory store size: ${memoryStore.size}`);
    
    if (redis && !redisConnectionFailed) {
      try {
        console.log('🔄 Attempting Redis lookup...');
        storedCode = await redis.get<string>(key);
        console.log(`📦 Redis returned: ${storedCode}`);
        if (storedCode === code) {
          await redis.del(key);
          console.log('✅ Code matched in Redis!');
          return true;
        }
      } catch (error) {
        console.warn('⚠️  Redis verification failed, trying memory fallback');
        redisConnectionFailed = true;
        redis = null;
        // Don't log the full error, just continue to fallback
      }
    }
    
    // Check memory fallback
    console.log('🔄 Checking memory fallback...');
    const memoryEntry = memoryStore.get(key);
    console.log(`📦 Memory entry:`, memoryEntry ? `code=${memoryEntry.code}, expires=${new Date(memoryEntry.expires)}` : 'Not found');
    
    if (memoryEntry) {
      // Check if expired
      if (Date.now() > memoryEntry.expires) {
        console.log('⏰ Code expired');
        memoryStore.delete(key);
        return false;
      }
      
      if (memoryEntry.code === code) {
        memoryStore.delete(key);
        console.log('✅ Code matched in memory store!');
        return true;
      } else {
        console.log(`❌ Code mismatch. Expected: ${memoryEntry.code}, Got: ${code}`);
      }
    } else {
      console.log('❌ No code found in memory store');
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verifying 2FA code:', error);
    return false;
  }
}

// Check if user has pending 2FA verification
export async function hasPending2FAVerification(userId: string): Promise<boolean> {
  try {
    // Check both registration and login 2FA codes
    const registrationKey = `2fa:${userId}:registration`;
    const loginKey = `2fa:${userId}:login`;
    
    if (redis && !redisConnectionFailed) {
      try {
        const [registrationExists, loginExists] = await Promise.all([
          redis.exists(registrationKey),
          redis.exists(loginKey)
        ]);
        return registrationExists === 1 || loginExists === 1;
      } catch (error) {
        // Only log once to avoid spam
        if (!redisConnectionFailed) {
          console.warn('Redis status check failed, checking memory fallback');
        }
        redisConnectionFailed = true;
        redis = null;
      }
    }
    
    // Check memory fallback
    const registrationEntry = memoryStore.get(registrationKey);
    const loginEntry = memoryStore.get(loginKey);
    
    // Check registration entry
    if (registrationEntry) {
      if (Date.now() > registrationEntry.expires) {
        memoryStore.delete(registrationKey);
      } else {
        return true;
      }
    }
    
    // Check login entry
    if (loginEntry) {
      if (Date.now() > loginEntry.expires) {
        memoryStore.delete(loginKey);
      } else {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
} 