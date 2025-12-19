import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  // Check if Accelerate is configured
  const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // Log environment info (without exposing sensitive data)
  if (accelerateEndpoint) {
    const endpointPreview = accelerateEndpoint.substring(0, 50) + '...';
    console.log('[Prisma] Accelerate endpoint configured:', endpointPreview);
    
    // Check if it's the correct format
    if (accelerateEndpoint.includes('accelerate.prisma-data.net')) {
      console.log('[Prisma] ✓ Endpoint format looks correct (Prisma Accelerate)');
    } else {
      console.warn('[Prisma] ⚠️  Endpoint format may be incorrect - should contain "accelerate.prisma-data.net"');
    }
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
      
      // withAccelerate() automatically reads from PRISMA_ACCELERATE_ENDPOINT env var
      // The format should be: prisma+postgres:// or prisma+mysql://accelerate.prisma-data.net/?api_key=...
      const acceleratedClient = client.$extends(
        withAccelerate()
      );
      
      console.log('[Prisma] ✓ Successfully initialized with Accelerate (Data Proxy)');
      console.log('[Prisma] ✓ Engine binary not required - using Data Proxy');
      return acceleratedClient;
    } catch (error) {
      console.error('[Prisma] ✗ Error initializing with Accelerate:', error);
      if (error instanceof Error) {
        console.error('[Prisma] Error message:', error.message);
      }
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