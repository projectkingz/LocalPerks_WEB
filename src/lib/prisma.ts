import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Check environment at module load
const isProduction = process.env.NODE_ENV === 'production';
const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;

if (isProduction && !accelerateEndpoint) {
  console.error('[Prisma] ⚠️  PRODUCTION WARNING: PRISMA_ACCELERATE_ENDPOINT not set!');
  console.error('[Prisma] ⚠️  This will cause Prisma Query Engine errors on Vercel!');
  console.error('[Prisma] ⚠️  Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
}

function createPrismaClient() {
  // Check if Accelerate is configured (re-check at runtime)
  const currentAccelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // Debug: Log all relevant environment variables (without exposing sensitive data)
  console.log('[Prisma] Environment check:');
  console.log('[Prisma]   NODE_ENV:', process.env.NODE_ENV);
  console.log('[Prisma]   PRISMA_ACCELERATE_ENDPOINT exists:', !!currentAccelerateEndpoint);
  console.log('[Prisma]   DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  // Log environment info (without exposing sensitive data)
  if (currentAccelerateEndpoint) {
    const endpointPreview = currentAccelerateEndpoint.substring(0, 50) + '...';
    console.log('[Prisma] Accelerate endpoint configured:', endpointPreview);
    console.log('[Prisma] Endpoint starts with:', currentAccelerateEndpoint.substring(0, 20));
    
    // Check if it's the correct format
    if (currentAccelerateEndpoint.includes('accelerate.prisma-data.net')) {
      console.log('[Prisma] ✓ Endpoint format looks correct (Prisma Accelerate)');
      
      // Check if protocol matches database type (MySQL vs PostgreSQL)
      if (currentAccelerateEndpoint.startsWith('prisma+mysql://')) {
        console.log('[Prisma] ✓ Protocol matches MySQL database');
      } else if (currentAccelerateEndpoint.startsWith('prisma+postgres://')) {
        console.error('[Prisma] ✗ ERROR: Endpoint uses postgres:// but database is MySQL!');
        console.error('[Prisma] ✗ This will cause connection failures!');
        console.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to use prisma+mysql://');
        // Still try to use it, but log the error
      } else if (currentAccelerateEndpoint.startsWith('prisma://')) {
        console.error('[Prisma] ✗ ERROR: Endpoint is missing database protocol!');
        console.error('[Prisma] ✗ Current format: prisma://accelerate.prisma-data.net/...');
        console.error('[Prisma] ✗ Should be: prisma+mysql://accelerate.prisma-data.net/...');
        console.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to include +mysql');
        console.error('[Prisma] ✗ This will cause connection failures!');
      } else {
        console.warn('[Prisma] ⚠️  Endpoint protocol unknown:', currentAccelerateEndpoint.substring(0, 20));
      }
    } else {
      console.warn('[Prisma] ⚠️  Endpoint format may be incorrect - should contain "accelerate.prisma-data.net"');
      console.warn('[Prisma] ⚠️  Current endpoint:', currentAccelerateEndpoint.substring(0, 100));
    }
  } else {
    console.error('[Prisma] ✗ ERROR: PRISMA_ACCELERATE_ENDPOINT not set!');
    console.error('[Prisma] ✗ Will try to use engine binary - this will FAIL on Vercel!');
    console.error('[Prisma] ✗ Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
  }
  
  if (currentAccelerateEndpoint) {
    // When using Accelerate, we MUST use the Accelerate endpoint as the datasource URL
    // This prevents Prisma Client from trying to initialize the engine binary
    try {
      console.log('[Prisma] Creating PrismaClient with Accelerate endpoint as datasource URL');
      
      // Create PrismaClient with Accelerate endpoint as the datasource URL
      // This prevents engine binary initialization
      const client = new PrismaClient({
        datasources: {
          db: {
            url: currentAccelerateEndpoint, // Use Accelerate endpoint instead of DATABASE_URL
          },
        },
        log: ['error'],
      });
      
      // Extend with Accelerate extension
      // This ensures all queries go through the Data Proxy
      const acceleratedClient = client.$extends(
        withAccelerate()
      );
      
      console.log('[Prisma] ✓ Successfully initialized with Accelerate (Data Proxy)');
      console.log('[Prisma] ✓ Engine binary not required - using Data Proxy');
      console.log('[Prisma] ✓ All queries will route through Prisma Accelerate');
      console.log('[Prisma] ✓ Datasource URL set to Accelerate endpoint');
      
      return acceleratedClient;
    } catch (error) {
      console.error('[Prisma] ✗ CRITICAL: Error initializing with Accelerate:', error);
      if (error instanceof Error) {
        console.error('[Prisma] Error name:', error.name);
        console.error('[Prisma] Error message:', error.message);
        console.error('[Prisma] Error stack:', error.stack);
      }
      // In production, fail fast if Accelerate doesn't work
      if (isProduction) {
        throw new Error(`Prisma Accelerate initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check PRISMA_ACCELERATE_ENDPOINT configuration.`);
      }
      throw error;
    }
  }
  
  // Fallback to standard Prisma Client (requires engine binary)
  // This should only happen in development
  if (isProduction) {
    throw new Error('PRISMA_ACCELERATE_ENDPOINT is required in production. Please set it in Vercel environment variables.');
  }
  
  console.log('[Prisma] Using standard Prisma Client - engine binary required');
  console.log('[Prisma] ⚠️  This is only for local development');
  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Force Accelerate in production if endpoint is available
// In Vercel/serverless, we MUST use Accelerate to avoid engine binary issues

// Create singleton instance
// Always create fresh in production to ensure Accelerate is checked
let prismaClient: any = null;

function getPrismaClient() {
  // In production, always check Accelerate on each access to ensure it's available
  if (isProduction) {
    const currentAccelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
    // If Accelerate endpoint exists but client wasn't created with it, recreate
    if (currentAccelerateEndpoint && (!prismaClient || !globalForPrisma.prisma)) {
      console.log('[Prisma] Recreating client with Accelerate in production');
      prismaClient = createPrismaClient();
      return prismaClient;
    }
  }
  
  // Create if doesn't exist
  if (!prismaClient) {
    prismaClient = createPrismaClient();
    // Cache in global for development only
    if (!isProduction) {
      globalForPrisma.prisma = prismaClient;
    }
  }
  
  return prismaClient;
}

// Export prisma with lazy initialization via Proxy
// This ensures Accelerate is checked on every access
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop];
    
    // Bind functions to maintain 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
  // Also handle property access for things like $connect, $disconnect, etc.
  has(_target, prop) {
    const client = getPrismaClient();
    return prop in client;
  }
}); 