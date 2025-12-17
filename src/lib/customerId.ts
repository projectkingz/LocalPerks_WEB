import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';

/**
 * Generates a 6-digit case-insensitive alphanumeric ID
 * Uses characters: 0-9, A-Z (case insensitive)
 * Total combinations: 36^6 = 2,176,782,336
 */
export function generateDisplayId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length); 
    result += chars[randomIndex];
  }

  return result;
}

/**
 * Generates a unique display ID and checks for collisions in the database                                                          
 * Will retry up to 10 times to find a unique ID
 * 
 * @param client - Optional Prisma client (for transactions). If not provided, uses shared client with Accelerate.
 * @param maxAttempts - Maximum number of attempts to generate a unique ID (default: 10)
 * 
 * Uses the shared Prisma client with Accelerate for optimal performance when no client is provided.
 */
export async function generateUniqueDisplayId(
  client?: PrismaClient | any,
  maxAttempts: number = 10
): Promise<string> {
  // Use provided client (for transactions) or fall back to shared client with Accelerate
  const dbClient = client || prisma;
  
  let attempts = 0;

  while (attempts < maxAttempts) {
    const displayId = generateDisplayId();

    // Check if this displayId already exists in the database     
    const existing = await dbClient.customer.findUnique({
      where: { displayId },
      select: { id: true }
    });

    if (!existing) {
      return displayId;
    }

    attempts++;
  }

  throw new Error(`Failed to generate unique display ID after ${maxAttempts} attempts`);                                            
}

/**
 * Formats a display ID for display (ensures uppercase)
 */
export function formatDisplayId(displayId: string | null | undefined): string {
  if (!displayId) return '';
  return displayId.toUpperCase().padStart(6, '0');
}

