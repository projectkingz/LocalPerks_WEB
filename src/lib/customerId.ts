import { PrismaClient } from '@prisma/client';

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
 */
export async function generateUniqueDisplayId(
  prisma: PrismaClient,
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const displayId = generateDisplayId();
    
    // Check if this displayId already exists in the database
    const existing = await prisma.customer.findUnique({
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

