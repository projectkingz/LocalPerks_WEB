/**
 * Environment Variables Configuration
 * Centralized environment variable management for production safety
 */

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  
  // App Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  
  // Email (Optional)
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  
  // Social Auth (Optional)
  GOOGLE_ID: process.env.GOOGLE_ID,
  GOOGLE_SECRET: process.env.GOOGLE_SECRET,
  FACEBOOK_ID: process.env.FACEBOOK_ID,
  FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,
  
  // Vonage (Optional - WhatsApp/SMS 2FA)
  VONAGE_API_KEY: process.env.VONAGE_API_KEY,
  VONAGE_API_SECRET: process.env.VONAGE_API_SECRET,
  VONAGE_WHATSAPP_NUMBER: process.env.VONAGE_WHATSAPP_NUMBER,
  VONAGE_SMS_NUMBER: process.env.VONAGE_SMS_NUMBER,
  
  // Redis (Optional)
  REDIS_URL: process.env.REDIS_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or Vercel environment variables.'
    );
  }
}

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

