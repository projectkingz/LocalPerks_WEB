import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { logger } from '@/lib/logger';

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
  logger.error('[Prisma] ⚠️  WARNING: PRISMA_ACCELERATE_ENDPOINT is not set in production!');
  logger.error('[Prisma] ⚠️  This will cause Prisma Query Engine errors at runtime!');
  logger.error('[Prisma] ⚠️  Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
  logger.error('[Prisma] ⚠️  Format should be: prisma+mysql://accelerate.prisma-data.net/?api_key=...');
  logger.error('[Prisma] ⚠️  Build will continue, but API routes will fail until this is set.');
}

// Create a simple, direct Prisma Client instance
// This matches the pattern used in test-accelerate route which works
function createSimplePrismaClient() {
  if (accelerateEndpoint) {
    logger.debug('[Prisma] Creating Prisma Client with Accelerate extension');
    return new PrismaClient().$extends(withAccelerate());
  }
  
  // In production without Accelerate, we still need to create a client
  // The --accelerate flag during generation creates a client that doesn't need the binary
  // But we should still try to use Accelerate if possible
  if (isProduction) {
    logger.warn('[Prisma] ⚠️  PRISMA_ACCELERATE_ENDPOINT not set, but continuing with direct connection');
    logger.warn('[Prisma] ⚠️  This may work if Prisma was generated with --accelerate flag');
  }
  
  return new PrismaClient();
}

function createPrismaClient() {
  // Check if Accelerate is configured (re-check at runtime)
  const currentAccelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
  
  // Debug: Log all relevant environment variables (without exposing sensitive data)
  logger.debug('[Prisma] Environment check:');
  logger.debug('[Prisma]   NODE_ENV:', process.env.NODE_ENV);
  logger.debug('[Prisma]   PRISMA_ACCELERATE_ENDPOINT exists:', !!currentAccelerateEndpoint);
  logger.debug('[Prisma]   DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  // Log environment info (without exposing sensitive data)
  if (currentAccelerateEndpoint) {
    const endpointPreview = currentAccelerateEndpoint.substring(0, 50) + '...';
    logger.debug('[Prisma] Accelerate endpoint configured:', endpointPreview);
    logger.debug('[Prisma] Endpoint starts with:', currentAccelerateEndpoint.substring(0, 20));
    
    // Check if it's the correct format
    if (currentAccelerateEndpoint.includes('accelerate.prisma-data.net')) {
      logger.debug('[Prisma] ✓ Endpoint format looks correct (Prisma Accelerate)');
      
      // Check if protocol matches database type (MySQL vs PostgreSQL)
      if (currentAccelerateEndpoint.startsWith('prisma+mysql://')) {
        logger.debug('[Prisma] ✓ Protocol matches MySQL database');
      } else if (currentAccelerateEndpoint.startsWith('prisma+postgres://')) {
        logger.error('[Prisma] ✗ ERROR: Endpoint uses postgres:// but database is MySQL!');
        logger.error('[Prisma] ✗ This will cause connection failures!');
        logger.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to use prisma+mysql://');
        // Still try to use it, but log the error
      } else if (currentAccelerateEndpoint.startsWith('prisma://')) {
        logger.error('[Prisma] ✗ ERROR: Endpoint is missing database protocol!');
        logger.error('[Prisma] ✗ Current format: prisma://accelerate.prisma-data.net/...');
        logger.error('[Prisma] ✗ Should be: prisma+mysql://accelerate.prisma-data.net/...');
        logger.error('[Prisma] ✗ Please update PRISMA_ACCELERATE_ENDPOINT in Vercel to include +mysql');
        logger.error('[Prisma] ✗ This will cause connection failures!');
      } else {
        logger.warn('[Prisma] ⚠️  Endpoint protocol unknown:', currentAccelerateEndpoint.substring(0, 20));
      }
    } else {
      logger.warn('[Prisma] ⚠️  Endpoint format may be incorrect - should contain "accelerate.prisma-data.net"');
      logger.warn('[Prisma] ⚠️  Current endpoint:', currentAccelerateEndpoint.substring(0, 100));
    }
  } else {
    logger.error('[Prisma] ✗ ERROR: PRISMA_ACCELERATE_ENDPOINT not set!');
    logger.error('[Prisma] ✗ Will try to use engine binary - this will FAIL on Vercel!');
    logger.error('[Prisma] ✗ Please set PRISMA_ACCELERATE_ENDPOINT in Vercel environment variables');
  }
  
  if (currentAccelerateEndpoint) {
    // When using Accelerate, keep DATABASE_URL as the datasource URL
    // The Accelerate extension reads PRISMA_ACCELERATE_ENDPOINT and routes queries through the Data Proxy
    // The extension prevents Prisma from trying to initialize the engine binary
    try {
      logger.debug('[Prisma] Initializing PrismaClient with Accelerate extension');
      logger.debug('[Prisma] Accelerate endpoint format:', currentAccelerateEndpoint.substring(0, 30) + '...');
      logger.debug('[Prisma] Using DATABASE_URL as datasource (Accelerate will proxy queries)');
      
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
      
      logger.debug('[Prisma] ✓ PrismaClient created');
      logger.debug('[Prisma] ✓ Accelerate extension applied');
      logger.debug('[Prisma] ✓ Queries will be routed through Accelerate Data Proxy');
      
      return acceleratedClient;
    } catch (error) {
      logger.error('[Prisma] ✗ CRITICAL: Error initializing with Accelerate:', error);
      if (error instanceof Error) {
        logger.error('[Prisma] Error name:', error.name);
        logger.error('[Prisma] Error message:', error.message);
        logger.error('[Prisma] Error stack:', error.stack);
      }
      // In production, fail fast if Accelerate doesn't work
      if (isProduction) {
        throw new Error(`Prisma Accelerate initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check PRISMA_ACCELERATE_ENDPOINT configuration.`);
      }
      throw error;
    }
  }
  
  // Fallback to standard Prisma Client
  // If generated with --accelerate flag, this won't require the binary
  if (isProduction) {
    logger.warn('[Prisma] ⚠️  PRISMA_ACCELERATE_ENDPOINT not set, using direct connection');
    logger.warn('[Prisma] ⚠️  This should work if Prisma was generated with --accelerate flag');
  }
  
  logger.debug('[Prisma] Using Prisma Client without Accelerate extension');
  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Force Accelerate in production if endpoint is available
// In Vercel/serverless, we MUST use Accelerate to avoid engine binary issues

// Create singleton instance
// In production with Accelerate, we create the client eagerly to ensure Accelerate is applied
let prismaClient: any = null;

function getPrismaClient() {
  // If client already exists and we're in production with Accelerate, return it
  // (We recreate it on each access in production to ensure Accelerate is used)
  if (prismaClient && !isProduction) {
    return prismaClient;
  }
  
  // In production, always check Accelerate on each access to ensure it's available
  if (isProduction) {
    const currentAccelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
    
    // Check if we're in a build context (Next.js build process)
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-production-compile';
    
    // If Accelerate is not configured, try to use direct connection
    // This works if Prisma was generated with --accelerate flag
    if (!currentAccelerateEndpoint) {
      if (isBuildTime) {
        // During build, create a client that will work at runtime
        logger.warn('[Prisma] ⚠️  Build-time: PRISMA_ACCELERATE_ENDPOINT not set, using direct connection');
        return createPrismaClient();
      } else {
        // At runtime, try direct connection (works with --accelerate flag)
        logger.warn('[Prisma] ⚠️  Runtime: PRISMA_ACCELERATE_ENDPOINT not set, using direct connection');
        return createPrismaClient();
      }
    }
    
    // In production with Accelerate, ALWAYS create a fresh client
    // This ensures Accelerate extension is always applied
    logger.debug('[Prisma] Creating fresh Prisma Client with Accelerate in production');
    prismaClient = createPrismaClient();
    return prismaClient;
  }
  
  // Development: Create client once and cache it
  if (!prismaClient) {
    try {
      prismaClient = createPrismaClient();
      globalForPrisma.prisma = prismaClient;
    } catch (error) {
      logger.error('[Prisma] Error creating client:', error);
      throw error;
    }
  }
  
  return prismaClient;
}

// Export prisma directly - use simple initialization that matches test-accelerate
// In development, cache in global to prevent multiple instances
// In production, always create fresh with Accelerate
let prismaInstance: any = null;

if (!isProduction) {
  // Development: cache in global
  prismaInstance = globalForPrisma.prisma || createSimplePrismaClient();
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaInstance;
  }
} else {
  // Production: always create fresh with Accelerate
  prismaInstance = createSimplePrismaClient();
}

export const prisma = prismaInstance; 