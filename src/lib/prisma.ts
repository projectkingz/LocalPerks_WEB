import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  // Configure Prisma Client for serverless environments
  const client = new PrismaClient({
    log: ['error'],
    // Explicitly set the engine type for serverless
    // This helps Prisma locate the correct engine binary
  });

  // In production/serverless, use Accelerate if configured
  // Otherwise use standard Prisma Client
  if (process.env.PRISMA_ACCELERATE_ENDPOINT) {
    return client.$extends(withAccelerate());
  }
  
  return client;
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