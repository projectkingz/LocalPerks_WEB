import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  // Check if Accelerate is configured
  const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // Debug: Log all relevant environment variables (without exposing sensitive data)
  console.log('[Prisma] Environment check:');
  console.log('[Prisma]   NODE_ENV:', process.env.NODE_ENV);
  console.log('[Prisma]   PRISMA_ACCELERATE_ENDPOINT exists:', !!accelerateEndpoint);
  console.log('[Prisma]   DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  // Log environment info (without exposing sensitive data)
  if (accelerateEndpoint) {
    const endpointPreview = accelerateEndpoint.substring(0, 50) + '...';
    console.log('[Prisma] Accelerate endpoint configured:', endpointPreview);
    console.log('[Prisma] Endpoint starts with:', accelerateEndpoint.substring(0, 20));
    
    // Check if it's the correct format
    if (accelerateEndpoint.includes('accelerate.prisma-data.net')) {
      console.log('[Prisma] ✓ Endpoint format looks correct (Prisma Accelerate)');
      
      // Check if protocol matches database type (MySQL vs PostgreSQL)
      if (accelerateEndpoint.startsWith('prisma+mysql://')) {
        console.log('[Prisma] ✓ Protocol matches MySQL database');
      } else if (accelerateEndpoint.startsWith('prisma+postgres://')) {
        console.error('[Prisma] ✗ ERROR: Endpoint uses postgres:// but database is MySQL!');
        console.error('[Prisma] ✗ This will cause connection failures!');
        console.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to use prisma+mysql://');
        // Still try to use it, but log the error
      } else if (accelerateEndpoint.startsWith('prisma://')) {
        console.error('[Prisma] ✗ ERROR: Endpoint is missing database protocol!');
        console.error('[Prisma] ✗ Current format: prisma://accelerate.prisma-data.net/...');
        console.error('[Prisma] ✗ Should be: prisma+mysql://accelerate.prisma-data.net/...');
        console.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to include +mysql');
        console.error('[Prisma] ✗ This will cause connection failures!');
      } else {
        console.warn('[Prisma] ⚠️  Endpoint protocol unknown:', accelerateEndpoint.substring(0, 20));
      }
    } else {
      console.warn('[Prisma] ⚠️  Endpoint format may be incorrect - should contain "accelerate.prisma-data.net"');
      console.warn('[Prisma] ⚠️  Current endpoint:', accelerateEndpoint.substring(0, 100));
    }
  } else {
    console.error('[Prisma] ✗ ERROR: PRISMA_ACCELERATE_ENDPOINT not set!');
    console.error('[Prisma] ✗ Will try to use engine binary - this will FAIL on Vercel!');
    console.error('[Prisma] ✗ Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
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

// Create singleton instance with lazy initialization
// In serverless environments, ensure Prisma Client uses Accelerate if available
let prismaClient: any = null;

function getPrismaClient() {
  // Always check for Accelerate endpoint - it might not be available at module load time
  const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // If we don't have a client yet, or Accelerate is now available, create/recreate it
  if (!prismaClient || (accelerateEndpoint && !globalForPrisma.prisma)) {
    prismaClient = createPrismaClient();
    // Cache in global for development
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient;
    }
  }
  
  return prismaClient;
}

// Export prisma - will be initialized on first access
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop];
    
    // Bind functions to the client to maintain 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
}); 