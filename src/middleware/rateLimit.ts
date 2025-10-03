import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

interface RateLimitConfig {
  maxRequests: number;  // Maximum number of requests
  windowMs: number;     // Time window in milliseconds
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 5,      // 5 requests
  windowMs: 60 * 1000, // per minute
};

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = defaultConfig
) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const ip = req.ip || 'anonymous';
  const key = `rate-limit:${ip}:${req.nextUrl.pathname}`;

  try {
    const [requests, _] = await redis
      .pipeline()
      .incr(key)
      .expire(key, Math.ceil(config.windowMs / 1000))
      .exec();

    const remainingRequests = config.maxRequests - (requests as number);
    const response = NextResponse.next();

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, remainingRequests).toString());

    if (remainingRequests < 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': (config.windowMs / 1000).toString(),
          },
        }
      );
    }

    return response;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request to proceed
    return NextResponse.next();
  }
}

// Specific rate limit configurations
export const authRateLimit = (req: NextRequest) =>
  rateLimit(req, {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

export const passwordResetRateLimit = (req: NextRequest) =>
  rateLimit(req, {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  }); 