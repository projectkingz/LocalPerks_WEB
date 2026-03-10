import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Redis initialisation (with in-memory fallback)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;
let redisConnectionFailed = false;
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

try {
  if (hasRedisConfig) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    redis.ping().catch((error) => {
      logger.warn('Redis connection test failed, using memory fallback:', error.message || error);
      redisConnectionFailed = true;
      redis = null;
    });
  }
} catch (error) {
  if (hasRedisConfig) logger.warn('Redis initialisation failed:', error);
  redisConnectionFailed = true;
  redis = null;
}

declare global {
  var __2fa_memory_store__: Map<string, { code: string; expires: number }> | undefined;
  var __2fa_cleanup_interval__: NodeJS.Timeout | undefined;
}

const memoryStore =
  global.__2fa_memory_store__ ?? new Map<string, { code: string; expires: number }>();
if (!global.__2fa_memory_store__) {
  global.__2fa_memory_store__ = memoryStore;
}

if (!global.__2fa_cleanup_interval__) {
  global.__2fa_cleanup_interval__ = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of Array.from(memoryStore.entries())) {
      if (now > entry.expires) { memoryStore.delete(key); cleaned++; }
    }
    if (cleaned > 0) logger.debug(`Cleaned up ${cleaned} expired 2FA entries`);
  }, 5 * 60 * 1000) as any;
}

// ---------------------------------------------------------------------------
// Twilio Verify config
// ---------------------------------------------------------------------------

const TWILIO_ACCOUNT_SID    = (process.env.TWILIO_ACCOUNT_SID     || '').trim();
const TWILIO_AUTH_TOKEN     = (process.env.TWILIO_AUTH_TOKEN       || '').trim();
const TWILIO_VERIFY_SID     = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();
const twilioConfigured      = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SID);

const TWILIO_PREFIX = 'twilio:';
const CODE_EXPIRY   = 10 * 60; // seconds

export type TwoFactorMethod = 'email' | 'sms' | 'whatsapp';

interface TwoFactorOptions {
  userId:   string;
  method:   TwoFactorMethod;
  email?:   string;
  phone?:   string;
  purpose?: string;
}

// ---------------------------------------------------------------------------
// Phone normalisation (UK default: E.164)
// ---------------------------------------------------------------------------

export function normalizePhoneNumber(phone: string): string {
  let n = phone.replace(/[^\d+]/g, '');
  if      (n.startsWith('0'))  n = '+44' + n.substring(1);
  else if (n.startsWith('+0')) n = '+44' + n.substring(2);
  else if (!n.startsWith('+')) n = '+44' + n;
  return n;
}

// ---------------------------------------------------------------------------
// Internal storage helpers
// ---------------------------------------------------------------------------

async function storeMarker(userId: string, to: string, purpose: string): Promise<void> {
  const key     = `2fa:${userId}:${purpose}`;
  const value   = TWILIO_PREFIX + to;
  const expires = Date.now() + CODE_EXPIRY * 1000;
  try {
    if (redis && !redisConnectionFailed) {
      await redis.set(key, value, { ex: CODE_EXPIRY });
    } else {
      memoryStore.set(key, { code: value, expires });
    }
  } catch {
    redisConnectionFailed = true;
    redis = null;
    memoryStore.set(key, { code: value, expires });
  }
}

async function getMarker(key: string): Promise<string | null> {
  if (redis && !redisConnectionFailed) {
    try {
      return await redis.get<string>(key);
    } catch {
      redisConnectionFailed = true;
      redis = null;
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { memoryStore.delete(key); return null; }
  return entry.code;
}

async function deleteMarker(key: string): Promise<void> {
  if (redis && !redisConnectionFailed) {
    try { await redis.del(key); } catch { /* fall through */ }
  }
  memoryStore.delete(key);
}

// ---------------------------------------------------------------------------
// Twilio Verify REST helpers
// ---------------------------------------------------------------------------

function twilioAuth(): string {
  return 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
}

/**
 * Send a Twilio Verify code.
 *
 * `to` values:
 *  - email:    user@example.com
 *  - sms:      +447123456789  (E.164)
 *  - whatsapp: +447123456789  (E.164 — Twilio handles the channel prefix internally)
 */
async function twilioSend(
  to: string,
  channel: 'email' | 'sms' | 'whatsapp',
): Promise<{ success: boolean; error?: string }> {
  if (!twilioConfigured) {
    return { success: false, error: 'Twilio Verify not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID)' };
  }
  try {
    const resp = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: twilioAuth() },
        body:    new URLSearchParams({ To: to, Channel: channel }),
      },
    );
    const data = await resp.json();
    if (resp.ok && data.status === 'pending') return { success: true };
    const msg = data.message || data.code || JSON.stringify(data);
    logger.error(`Twilio Verify send failed (${channel}):`, msg);
    return { success: false, error: msg };
  } catch (err: any) {
    logger.error(`Twilio Verify send error (${channel}):`, err.message || err);
    return { success: false, error: err.message || 'Failed to send' };
  }
}

/**
 * Check a Twilio Verify code.
 * `to` must match exactly what was used in twilioSend.
 */
async function twilioCheck(
  to: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  if (!twilioConfigured) {
    return { success: false, error: 'Twilio Verify not configured' };
  }
  try {
    const resp = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: twilioAuth() },
        body:    new URLSearchParams({ To: to, Code: code }),
      },
    );
    const data = await resp.json();
    if (resp.ok && data.status === 'approved') return { success: true };
    return { success: false, error: data.message || data.code || JSON.stringify(data) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to check' };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Generate and send a 2FA code via Twilio Verify. */
export async function generateAndSend2FACode(options: TwoFactorOptions): Promise<{
  success: boolean;
  message?: string;
  method?: TwoFactorMethod;
}> {
  try {
    const { userId, method, email, phone, purpose = 'registration' } = options;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User not found' };

    const key = `2fa:${userId}:${purpose}`;

    // Prevent duplicate sends within the TTL window
    const existing = await getMarker(key);
    if (existing) {
      return { success: true, message: 'A verification code was already sent. Please check your messages.' };
    }

    // --- Email ---
    if (method === 'email' && email) {
      const result = await twilioSend(email, 'email');
      if (!result.success) return { success: false, message: result.error || 'Failed to send email verification' };
      await storeMarker(userId, email, purpose);
      return { success: true, message: 'Verification sent via email', method: 'email' };
    }

    // --- WhatsApp (with SMS fallback) ---
    if (method === 'whatsapp' && phone) {
      const to = normalizePhoneNumber(phone);
      const waResult = await twilioSend(to, 'whatsapp');
      if (waResult.success) {
        await storeMarker(userId, to, purpose);
        return { success: true, message: 'Verification sent via WhatsApp', method: 'whatsapp' };
      }
      logger.warn('WhatsApp verification failed, falling back to SMS:', waResult.error);
      const smsResult = await twilioSend(to, 'sms');
      if (!smsResult.success) return { success: false, message: smsResult.error || 'Failed to send verification' };
      await storeMarker(userId, to, purpose);
      return { success: true, message: 'Verification sent via SMS', method: 'sms' };
    }

    // --- SMS ---
    if (method === 'sms' && phone) {
      const to = normalizePhoneNumber(phone);
      const result = await twilioSend(to, 'sms');
      if (!result.success) return { success: false, message: result.error || 'Failed to send SMS verification' };
      await storeMarker(userId, to, purpose);
      return { success: true, message: 'Verification sent via SMS', method: 'sms' };
    }

    return { success: false, message: 'Invalid 2FA method or missing contact information' };
  } catch (error) {
    logger.error('Error generating 2FA code:', error);
    return { success: false, message: 'Failed to generate and send 2FA code' };
  }
}

/** Verify a 2FA code via Twilio Verify. */
export async function verify2FACode(options: {
  userId:   string;
  code:     string;
  purpose?: string;
}): Promise<boolean> {
  try {
    const { userId, code, purpose = 'registration' } = options;
    const key          = `2fa:${userId}:${purpose}`;
    const attemptsKey  = `2fa-attempts:${userId}:${purpose}`;

    // Brute-force protection
    const MAX_ATTEMPTS = 5;
    let failedAttempts = 0;
    if (redis && !redisConnectionFailed) {
      try { failedAttempts = (await redis.get<number>(attemptsKey)) || 0; } catch { /* fall through */ }
    }
    if (failedAttempts === 0) {
      const entry = memoryStore.get(attemptsKey);
      if (entry && Date.now() < entry.expires) failedAttempts = parseInt(entry.code) || 0;
    }
    if (failedAttempts >= MAX_ATTEMPTS) {
      logger.warn(`2FA brute-force protection triggered for user ${userId} (${purpose})`);
      return false;
    }

    const storedValue = await getMarker(key);
    if (!storedValue || !storedValue.startsWith(TWILIO_PREFIX)) {
      logger.debug('No pending Twilio verification found');
      return false;
    }

    const to = storedValue.slice(TWILIO_PREFIX.length);

    const recordFailedAttempt = async () => {
      const newCount = failedAttempts + 1;
      if (redis && !redisConnectionFailed) {
        try {
          await redis.incr(attemptsKey);
          await redis.expire(attemptsKey, CODE_EXPIRY);
          return;
        } catch { /* fall through */ }
      }
      memoryStore.set(attemptsKey, { code: String(newCount), expires: Date.now() + CODE_EXPIRY * 1000 });
    };

    const result = await twilioCheck(to, code);
    if (result.success) {
      await deleteMarker(key);
      return true;
    }

    logger.debug('Twilio verification check failed:', result.error);
    await recordFailedAttempt();
    return false;
  } catch (error) {
    logger.error('Error verifying 2FA code:', error);
    return false;
  }
}

/** Returns true if the user has a pending 2FA verification (registration or login). */
export async function hasPending2FAVerification(userId: string): Promise<boolean> {
  try {
    const registrationKey = `2fa:${userId}:registration`;
    const loginKey        = `2fa:${userId}:login`;

    if (redis && !redisConnectionFailed) {
      try {
        const [regExists, loginExists] = await Promise.all([
          redis.exists(registrationKey),
          redis.exists(loginKey),
        ]);
        return regExists === 1 || loginExists === 1;
      } catch {
        redisConnectionFailed = true;
        redis = null;
      }
    }

    const regEntry   = memoryStore.get(registrationKey);
    const loginEntry = memoryStore.get(loginKey);
    if (regEntry   && Date.now() < regEntry.expires)   return true;
    if (loginEntry && Date.now() < loginEntry.expires) return true;
    return false;
  } catch (error) {
    logger.error('Error checking 2FA status:', error);
    return false;
  }
}
