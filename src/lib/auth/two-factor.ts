import { Redis } from '@upstash/redis';
import { tokenGenerate } from '@vonage/jwt';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendVerificationCodeEmail } from '@/lib/email/mailtrap';

// Initialize Redis with error handling
let redis: Redis | null = null;
let redisConnectionFailed = false;
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

try {
  if (hasRedisConfig) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    // Test connection asynchronously (don't block initialization)
    redis.ping().catch((error) => {
      logger.warn('Redis connection test failed, will use memory fallback:', error.message || error);
      redisConnectionFailed = true;
      redis = null;
    });
  }
} catch (error) {
  if (hasRedisConfig) {
    logger.warn('Redis initialization failed:', error);
  }
  redisConnectionFailed = true;
  redis = null;
}

// In-memory fallback for when Redis is unavailable
declare global {
  var __2fa_memory_store__: Map<string, { code: string; expires: number }> | undefined;
  var __2fa_cleanup_interval__: NodeJS.Timeout | undefined;
}

const memoryStore = global.__2fa_memory_store__ ?? new Map<string, { code: string; expires: number }>();
if (!global.__2fa_memory_store__) {
  global.__2fa_memory_store__ = memoryStore;
  logger.debug('🆕 Created new global memory store for 2FA codes');
} else {
  logger.debug('♻️  Reusing existing global memory store for 2FA codes');
}

// Cleanup expired entries from memory store every 5 minutes
if (!global.__2fa_cleanup_interval__) {
  global.__2fa_cleanup_interval__ = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    const entries = Array.from(memoryStore.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expires) {
        memoryStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`🧹 Cleaned up ${cleaned} expired 2FA codes`);
    }
  }, 5 * 60 * 1000) as any;
}

// Vonage config
const VONAGE_API_KEY = (process.env.VONAGE_API_KEY || '').trim();
const VONAGE_API_SECRET = (process.env.VONAGE_API_SECRET || '').trim();
const VONAGE_APPLICATION_ID = (process.env.VONAGE_APPLICATION_ID || '').trim();
const VONAGE_PRIVATE_KEY = (process.env.VONAGE_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');
const VONAGE_WHATSAPP_NUMBER = (process.env.VONAGE_WHATSAPP_NUMBER || '').trim();
const VONAGE_SMS_NUMBER = (process.env.VONAGE_SMS_NUMBER || '').trim();
const vonageConfigured = !!(VONAGE_API_KEY && VONAGE_API_SECRET);
const messagesApiJwtConfigured = !!(VONAGE_APPLICATION_ID && VONAGE_PRIVATE_KEY);
const MESSAGES_API_URL = process.env.VONAGE_MESSAGES_SANDBOX === 'true'
  ? 'https://messages-sandbox.nexmo.com/v1/messages'
  : 'https://api.nexmo.com/v1/messages';

const CODE_EXPIRY = 10 * 60; // 10 minutes in seconds

export type TwoFactorMethod = 'email' | 'sms' | 'whatsapp';

interface TwoFactorOptions {
  userId: string;
  method: TwoFactorMethod;
  email?: string;
  phone?: string;
  purpose?: string;
}

const VONAGE_PREFIX = 'vonage:';

// Generate a random numeric code (for email only) - 4 digits
function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Store 2FA code or Vonage request_id in Redis or memory
async function storeCode(userId: string, value: string, purpose: string = 'registration'): Promise<void> {
  const key = `2fa:${userId}:${purpose}`;
  const expires = Date.now() + (CODE_EXPIRY * 1000);

  logger.debug(`\n💾 Storing for key: ${key}`);
  logger.debug(`⏰ Expires: ${new Date(expires)}`);

  try {
    if (redis && !redisConnectionFailed) {
      await redis.set(key, value, { ex: CODE_EXPIRY });
      logger.debug('✅ Stored in Redis');
    } else {
      memoryStore.set(key, { code: value, expires });
      logger.debug('✅ Using in-memory fallback for 2FA storage');
      logger.debug(`📊 Memory store now has ${memoryStore.size} entries`);
    }
  } catch (error) {
    logger.warn('⚠️  Failed to store in Redis, using memory fallback');
    redisConnectionFailed = true;
    redis = null;
    memoryStore.set(key, { code: value, expires });
  }
}

// Send code via email using Mailtrap
async function sendCodeViaEmail(email: string, code: string, name: string): Promise<boolean> {
  try {
    const success = await sendVerificationCodeEmail(email, code, name);
    if (success) {
      logger.debug(`✅ Verification email sent to ${email} via Mailtrap`);
    }
    return success;
  } catch (error) {
    logger.error('❌ Error sending 2FA email:', error);
    return false;
  }
}

// Get Messages API auth header (JWT preferred for WhatsApp; Basic as fallback)
function getMessagesApiAuthHeader(): string | null {
  if (messagesApiJwtConfigured) {
    try {
      const jwt = tokenGenerate(VONAGE_APPLICATION_ID, VONAGE_PRIVATE_KEY);
      return `Bearer ${jwt}`;
    } catch (err) {
      logger.warn('⚠️  Vonage JWT generation failed:', (err as Error).message);
    }
  }
  if (vonageConfigured) {
    const auth = Buffer.from(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`).toString('base64');
    return `Basic ${auth}`;
  }
  return null;
}

// Send code via Vonage Messages API (WhatsApp or SMS)
async function sendCodeViaMessagesAPI(
  phone: string,
  code: string,
  channel: 'whatsapp' | 'sms',
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const authHeader = getMessagesApiAuthHeader();
    if (!authHeader) {
      return { success: false, error: 'Vonage Messages API not configured (need JWT or API key)' };
    }

    // Vonage expects "to" as digits only (no +)
    const to = phone.replace(/\D/g, '');
    const from = fromNumber.replace(/\D/g, '');

    const body: Record<string, unknown> = {
      from,
      to,
      message_type: 'text',
      channel,
      text: { body: `Your LocalPerks verification code is: ${code}. Valid for 10 minutes.` },
    };

    const response = await fetch(MESSAGES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.message_uuid) {
      logger.debug(`✅ Vonage Messages API (${channel}) sent successfully`);
      return { success: true };
    }

    const errorMsg = data.detail || data['invalid_parameters']?.[0]?.message || JSON.stringify(data);
    return { success: false, error: errorMsg };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`❌ Vonage Messages API (${channel}) error:`, err.message || error);
    return { success: false, error: err.message || 'Failed to send' };
  }
}

// Send verification via Vonage Verify API (SMS only)
async function sendCodeViaVonageVerify(phone: string): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!vonageConfigured) {
    return { success: false, error: 'Vonage not configured' };
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    logger.debug(`📤 Sending Vonage Verify SMS to: ${normalizedPhone}`);

    const response = await fetch('https://api.nexmo.com/verify/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        number: normalizedPhone,
        brand: 'LocalPerks',
      }),
    });

    const data = await response.json();

    if (data.status === '0' && data.request_id) {
      logger.debug(`✅ Vonage Verify SMS sent (request_id: ${data.request_id})`);
      return { success: true, requestId: data.request_id };
    }

    return { success: false, error: data['error-text'] || data['error_code_label'] || JSON.stringify(data) };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || 'Failed to send' };
  }
}

// Try WhatsApp first, then SMS fallback (Messages API or Vonage Verify)
async function sendCodeViaVonageWhatsAppOrSms(phone: string, code: string): Promise<{
  success: boolean;
  method: 'whatsapp' | 'sms';
  requestId?: string;
  useVerifyFlow?: boolean;
  error?: string;
}> {
  if (!vonageConfigured) {
    logger.warn('Vonage not configured - verification NOT sent. Configure: VONAGE_API_KEY, VONAGE_API_SECRET');
    return { success: false, method: 'sms', error: 'Vonage not configured' };
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  // 1. Try WhatsApp first (if configured)
  if (VONAGE_WHATSAPP_NUMBER) {
    const whatsappFrom = VONAGE_WHATSAPP_NUMBER.replace(/\D/g, '');
    logger.debug(`📤 Trying WhatsApp first to: ${normalizedPhone}`);
    const waResult = await sendCodeViaMessagesAPI(normalizedPhone, code, 'whatsapp', whatsappFrom);
    if (waResult.success) {
      return { success: true, method: 'whatsapp' };
    }
    logger.warn(`⚠️  WhatsApp failed: ${waResult.error}. Falling back to SMS...`);
  } else {
    logger.debug('📤 VONAGE_WHATSAPP_NUMBER not set, skipping WhatsApp');
  }

  // 2. Try SMS via Messages API (if VONAGE_SMS_NUMBER configured)
  if (VONAGE_SMS_NUMBER) {
    const smsFrom = VONAGE_SMS_NUMBER.replace(/\D/g, '');
    logger.debug(`📤 Trying SMS via Messages API to: ${normalizedPhone}`);
    const smsResult = await sendCodeViaMessagesAPI(normalizedPhone, code, 'sms', smsFrom);
    if (smsResult.success) {
      return { success: true, method: 'sms' };
    }
    logger.warn(`⚠️  SMS Messages API failed: ${smsResult.error}. Trying Vonage Verify...`);
  }

  // 3. Fallback: Vonage Verify API (SMS, no WhatsApp number needed)
  logger.debug(`📤 Fallback: Vonage Verify SMS to: ${normalizedPhone}`);
  const verifyResult = await sendCodeViaVonageVerify(normalizedPhone);
  if (verifyResult.success && verifyResult.requestId) {
    return {
      success: true,
      method: 'sms',
      requestId: verifyResult.requestId,
      useVerifyFlow: true,
    };
  }

  return {
    success: false,
    method: 'sms',
    error: verifyResult.error || 'Failed to send verification',
  };
}

// Normalize phone number to E.164 format
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '');

  logger.debug(`📞 Original phone: ${phone}`);

  if (normalized.startsWith('0')) {
    normalized = '+44' + normalized.substring(1);
    logger.debug(`🇬🇧 Detected UK number, converted to: ${normalized}`);
  } else if (!normalized.startsWith('+')) {
    normalized = '+44' + normalized;
    logger.debug(`🇬🇧 Added UK country code: ${normalized}`);
  } else if (normalized.startsWith('+0')) {
    normalized = '+44' + normalized.substring(2);
    logger.debug(`🔧 Fixed invalid +0 prefix to: ${normalized}`);
  }

  logger.debug(`✅ Normalized phone: ${normalized}`);
  return normalized;
}

// Generate and send 2FA code
export async function generateAndSend2FACode(options: TwoFactorOptions): Promise<{
  success: boolean;
  message?: string;
  method?: 'email' | 'whatsapp' | 'sms';
}> {
  try {
    const { userId, method, email, phone, purpose = 'registration' } = options;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const key = `2fa:${userId}:${purpose}`;
    let existingValue: string | null = null;

    if (redis && !redisConnectionFailed) {
      try {
        existingValue = await redis.get<string>(key);
      } catch {
        // Ignore Redis errors
      }
    }

    if (!existingValue) {
      const memoryEntry = memoryStore.get(key);
      if (memoryEntry && Date.now() < memoryEntry.expires) {
        existingValue = memoryEntry.code;
      }
    }

    if (existingValue) {
      logger.debug('⚠️  Verification already sent for this user and purpose');
      return {
        success: true,
        message: 'A verification code was already sent. Please check your messages.',
      };
    }

    if (method === 'email' && email) {
      const code = generateCode();
      await storeCode(userId, code, purpose);

      logger.debug(`\n🔐 GENERATED 2FA CODE (email)`);

      const sent = await sendCodeViaEmail(email, code, user.name || 'User');
      if (!sent) {
        logger.debug(`\n⚠️  IMPORTANT: Email not configured. Use this code: ${code}\n`);
        return {
          success: false,
          message: 'Failed to send code via email',
        };
      }
      return { success: true, message: 'Verification sent via email', method: 'email' };
    }

    if ((method === 'sms' || method === 'whatsapp') && phone) {
      // WhatsApp first, then SMS fallback (Vonage Messages API + Verify fallback)
      const code = generateCode();
      const result = await sendCodeViaVonageWhatsAppOrSms(phone, code);

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to send verification',
        };
      }

      if (result.useVerifyFlow && result.requestId) {
        await storeCode(userId, VONAGE_PREFIX + result.requestId, purpose);
        logger.debug(`\n🔐 VONAGE VERIFY SENT (SMS fallback)`);
      } else {
        await storeCode(userId, code, purpose);
        logger.debug(`\n🔐 VONAGE MESSAGES SENT (${result.method})`);
      }

      const deliveryMethod = result.method === 'whatsapp' ? 'WhatsApp' : 'SMS';
      return { success: true, message: `Verification sent via ${deliveryMethod}`, method: result.method };
    }

    return {
      success: false,
      message: 'Invalid 2FA method or missing contact information',
    };
  } catch (error) {
    logger.error('Error generating 2FA code:', error);
    return {
      success: false,
      message: 'Failed to generate and send 2FA code',
    };
  }
}

// Verify 2FA code (handles both email codes and Vonage Verify)
export async function verify2FACode(options: { userId: string; code: string; purpose?: string }): Promise<boolean> {
  try {
    const { userId, code, purpose = 'registration' } = options;
    const key = `2fa:${userId}:${purpose}`;
    let storedValue: string | null = null;

    logger.debug(`\n🔑 Verifying 2FA code for key: ${key}`);

    if (redis && !redisConnectionFailed) {
      try {
        storedValue = await redis.get<string>(key);
      } catch {
        redisConnectionFailed = true;
        redis = null;
      }
    }

    if (!storedValue) {
      const memoryEntry = memoryStore.get(key);
      if (memoryEntry) {
        if (Date.now() > memoryEntry.expires) {
          logger.debug('⏰ Code expired');
          memoryStore.delete(key);
          return false;
        }
        storedValue = memoryEntry.code;
      }
    }

    if (!storedValue) {
      logger.debug('❌ No verification found');
      return false;
    }

    // Vonage Verify flow: stored value is "vonage:REQUEST_ID"
    if (storedValue.startsWith(VONAGE_PREFIX)) {
      const requestId = storedValue.slice(VONAGE_PREFIX.length);

      if (!vonageConfigured) {
        logger.error('❌ Vonage not configured - cannot verify');
        return false;
      }

      try {
        const response = await fetch('https://api.nexmo.com/verify/check/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            api_key: VONAGE_API_KEY,
            api_secret: VONAGE_API_SECRET,
            request_id: requestId,
            code,
          }),
        });

        const data = await response.json();

        if (data.status === '0') {
          if (redis && !redisConnectionFailed) {
            await redis.del(key);
          } else {
            memoryStore.delete(key);
          }
          logger.debug('✅ Vonage Verify code matched!');
          return true;
        }

        logger.debug(`❌ Vonage Verify failed: ${data['error-text'] || data.status}`);
        return false;
      } catch (error) {
        logger.error('❌ Vonage Verify check error:', error);
        return false;
      }
    }

    // Email flow: compare stored code
    if (storedValue === code) {
      if (redis && !redisConnectionFailed) {
        await redis.del(key);
      } else {
        memoryStore.delete(key);
      }
      logger.debug('✅ Code matched!');
      return true;
    }

    logger.debug(`❌ Code mismatch`);
    return false;
  } catch (error) {
    logger.error('❌ Error verifying 2FA code:', error);
    return false;
  }
}

// Check if user has pending 2FA verification
export async function hasPending2FAVerification(userId: string): Promise<boolean> {
  try {
    const registrationKey = `2fa:${userId}:registration`;
    const loginKey = `2fa:${userId}:login`;

    if (redis && !redisConnectionFailed) {
      try {
        const [registrationExists, loginExists] = await Promise.all([
          redis.exists(registrationKey),
          redis.exists(loginKey),
        ]);
        return registrationExists === 1 || loginExists === 1;
      } catch {
        redisConnectionFailed = true;
        redis = null;
      }
    }

    const registrationEntry = memoryStore.get(registrationKey);
    const loginEntry = memoryStore.get(loginKey);

    if (registrationEntry && Date.now() < registrationEntry.expires) return true;
    if (loginEntry && Date.now() < loginEntry.expires) return true;

    return false;
  } catch (error) {
    logger.error('Error checking 2FA status:', error);
    return false;
  }
}
