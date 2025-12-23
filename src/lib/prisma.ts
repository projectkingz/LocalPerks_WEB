import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Check environment at module load
const isProduction = process.env.NODE_ENV === 'production';
const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;

// In production, Accelerate is REQUIRED - but only fail at runtime, not during build
// During build, Next.js tries to statically generate pages, which imports this module
// We'll check again when Prisma Client is actually used (in getPrismaClient)
if (isProduction && !accelerateEndpoint) {
  console.error('[Prisma] ⚠️  WARNING: PRISMA_ACCELERATE_ENDPOINT is not set in production!');
  console.error('[Prisma] ⚠️  This will cause Prisma Query Engine errors at runtime!');
  console.error('[Prisma] ⚠️  Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
  console.error('[Prisma] ⚠️  Format should be: prisma+mysql://accelerate.prisma-data.net/?api_key=...');
  console.error('[Prisma] ⚠️  Build will continue, but API routes will fail until this is set.');
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
    // When using Accelerate, keep DATABASE_URL as the datasource URL
    // The Accelerate extension reads PRISMA_ACCELERATE_ENDPOINT and routes queries through the Data Proxy
    // The extension prevents Prisma from trying to initialize the engine binary
    try {
      console.log('[Prisma] Initializing PrismaClient with Accelerate extension');
      console.log('[Prisma] Accelerate endpoint format:', currentAccelerateEndpoint.substring(0, 30) + '...');
      console.log('[Prisma] Using DATABASE_URL as datasource (Accelerate will proxy queries)');
      
      // Create PrismaClient with DATABASE_URL (Accelerate extension will handle routing)
      // IMPORTANT: Do NOT use the Accelerate endpoint as datasource URL - use DATABASE_URL
      // CRITICAL: Apply Accelerate extension IMMEDIATELY to prevent engine binary initialization
      const acceleratedClient = new PrismaClient({
        log: ['error'],
      }).$extends(
        withAccelerate()
      );
      
      // The Accelerate extension automatically reads PRISMA_ACCELERATE_ENDPOINT from env vars
      // and routes all queries through the Data Proxy, preventing engine binary initialization
      
      console.log('[Prisma] ✓ PrismaClient created');
      console.log('[Prisma] ✓ Accelerate extension applied');
      console.log('[Prisma] ✓ Queries will be routed through Accelerate Data Proxy');
      
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
    
    // Check if we're in a build context (Next.js build process)
    // During build, Next.js might evaluate API routes, but we shouldn't fail the build
    // Only check NEXT_PHASE for build detection - VERCEL env vars are set at runtime too
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-production-compile';
    
    // CRITICAL: Fail at runtime if Accelerate is not configured in production
    // But only if we're NOT in build phase (to allow build to succeed)
    if (!currentAccelerateEndpoint) {
      if (isBuildTime) {
        // During build, just log a warning but don't throw
        console.warn('[Prisma] ⚠️  Build-time: PRISMA_ACCELERATE_ENDPOINT not set, but allowing build to continue');
        console.warn('[Prisma] ⚠️  This will fail at runtime if not set in Vercel environment variables');
        // Create a dummy client for build time that will fail gracefully
        // We'll use the fallback client creation below
      } else {
        // At runtime, fail immediately
        const errorMsg = '[Prisma] CRITICAL ERROR: PRISMA_ACCELERATE_ENDPOINT is not set in production!';
        console.error(errorMsg);
        console.error('[Prisma] This will cause Prisma Query Engine errors on Vercel!');
        console.error('[Prisma] Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
        console.error('[Prisma] Format should be: prisma+mysql://accelerate.prisma-data.net/?api_key=...');
        throw new Error(`${errorMsg} Please configure PRISMA_ACCELERATE_ENDPOINT in Vercel.`);
      }
    }
    
    // IMPORTANT: Always recreate client if Accelerate endpoint exists
    // This ensures we always use Accelerate, even if client was cached without it
    if (currentAccelerateEndpoint) {
      // In production, ALWAYS recreate the client to ensure Accelerate is used
      // This prevents any cached client from being used without Accelerate
      console.log('[Prisma] Creating/Recreating client with Accelerate in production');
      prismaClient = createPrismaClient();
      // Don't cache in global for production - always recreate to ensure Accelerate
      return prismaClient;
    }
  }
  
  // Create if doesn't exist
  // During build without Accelerate, this will create a client that will fail at runtime
  // but won't fail the build itself
  if (!prismaClient) {
    try {
      prismaClient = createPrismaClient();
      // Cache in global for development only
      if (!isProduction) {
        globalForPrisma.prisma = prismaClient;
      }
    } catch (error) {
      // During build, if client creation fails, create a dummy client
      // This allows the build to succeed, but queries will fail at runtime
      if (isProduction && (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-production-compile')) {
        console.warn('[Prisma] Build-time: Creating dummy client to allow build to succeed');
        // Return a proxy that will throw helpful errors at runtime
        prismaClient = new Proxy({}, {
          get() {
            throw new Error('PRISMA_ACCELERATE_ENDPOINT must be set in Vercel environment variables. Build succeeded, but runtime queries will fail until this is configured.');
          }
        });
      } else {
        throw error;
      }
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