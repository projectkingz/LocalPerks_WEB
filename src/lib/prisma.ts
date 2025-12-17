import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error'],
  });

  // In production/serverless, use Accelerate if configured
  // Otherwise use standard Prisma Client
  if (process.env.PRISMA_ACCELERATE_ENDPOINT) {
    return client.$extends(withAccelerate());
  }
  
  return client;
}

// Create singleton instance
const prismaClient = createPrismaClient();

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 