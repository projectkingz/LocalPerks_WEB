import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  // Check if Accelerate is configured
  const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // Log environment info (without exposing the full endpoint)
  if (accelerateEndpoint) {
    console.log('[Prisma] Accelerate endpoint configured:', accelerateEndpoint.substring(0, 30) + '...');
  } else {
    console.warn('[Prisma] WARNING: PRISMA_ACCELERATE_ENDPOINT not set - will try to use engine binary');
    console.warn('[Prisma] This may fail in serverless environments like Vercel');
  }
  
  if (accelerateEndpoint) {
    // When using Accelerate, create PrismaClient and extend it immediately
    // Accelerate uses the Data Proxy, so no engine binary is needed
    try {
      const client = new PrismaClient({
        log: ['error'],
      });
      
      const acceleratedClient = client.$extends(
        withAccelerate({
          cache: true, // Enable query result caching
        })
      );
      
      console.log('[Prisma] Successfully initialized with Accelerate (Data Proxy)');
      return acceleratedClient;
    } catch (error) {
      console.error('[Prisma] Error initializing with Accelerate:', error);
      throw error;
    }
  }
  
  // Fallback to standard Prisma Client (requires engine binary)
  console.log('[Prisma] Using standard Prisma Client - engine binary required');
  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Create singleton instance
// In serverless environments, we need to ensure Prisma Client is properly initialized
const prismaClient = createPrismaClient();

export const prisma = globalForPrisma.prisma ?? prismaClient;

// In development, reuse the same instance
// In production/serverless, create a new instance per request (handled by Next.js)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 