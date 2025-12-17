import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error'],
  });

  // Wrap with Accelerate for improved performance and connection pooling
  // Accelerate provides connection pooling, query caching, and faster network round-trips
  return client.$extends(withAccelerate());
}

// Create singleton instance with Accelerate
const prismaClient = createPrismaClient();

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 