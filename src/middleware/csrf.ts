import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Generate a CSRF token
export async function generateToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `csrf:${sessionId}`;
  
  // Store token with 24-hour expiry
  await redis.set(key, token, { ex: 24 * 60 * 60 });
  
  return token;
}

// Validate a CSRF token
export async function validateToken(sessionId: string, token: string): Promise<boolean> {
  const key = `csrf:${sessionId}`;
  const storedToken = await redis.get<string>(key);
  
  if (!storedToken || storedToken !== token) {
    return false;
  }
  
  // Delete the token after use (one-time use)
  await redis.del(key);
  return true;
}

// CSRF protection middleware
export async function csrfProtection(req: NextRequest) {
  // Skip CSRF check for non-mutation methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return NextResponse.next();
  }

  // Skip CSRF check in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get('session_id')?.value;
  const csrfToken = req.headers.get('X-CSRF-Token');

  if (!sessionId || !csrfToken) {
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'Missing CSRF token or session ID',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const isValid = await validateToken(sessionId, csrfToken);

  if (!isValid) {
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return NextResponse.next();
} 