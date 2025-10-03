import { prisma } from '@/lib/prisma';

/**
 * Generate a unique voucher code
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique voucher code that doesn't exist in the database
 */
export async function generateUniqueVoucherCode(): Promise<string> {
  let code: string;
  let isUnique = false;
  
  while (!isUnique) {
    code = generateVoucherCode();
    const existingVoucher = await prisma.voucher.findUnique({
      where: { code }
    });
    
    if (!existingVoucher) {
      isUnique = true;
      return code;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  return generateVoucherCode();
}

/**
 * Create a voucher for a redemption
 */
export async function createVoucherForRedemption(
  redemptionId: string,
  customerId: string,
  rewardId: string
): Promise<any> {
  const code = await generateUniqueVoucherCode();
  
  // Set expiration date to 1 year from now
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  const voucher = await prisma.voucher.create({
    data: {
      code,
      redemptionId,
      customerId,
      rewardId,
      status: 'active',
      expiresAt,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      reward: {
        select: {
          id: true,
          name: true,
          description: true,
          points: true,
        }
      }
    }
  });
  
  return voucher;
}

/**
 * Create a voucher for a redemption using a transaction instance
 */
export async function createVoucherForRedemptionWithTx(
  tx: any,
  redemptionId: string,
  customerId: string,
  rewardId: string
): Promise<any> {
  const code = await generateUniqueVoucherCode();
  
  // Set expiration date to 1 year from now
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  const voucher = await tx.voucher.create({
    data: {
      code,
      redemptionId,
      customerId,
      rewardId,
      status: 'active',
      expiresAt,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      reward: {
        select: {
          id: true,
          name: true,
          description: true,
          points: true,
        }
      }
    }
  });
  
  return voucher;
}

/**
 * Use a voucher (mark as used)
 */
export async function useVoucher(voucherCode: string): Promise<any> {
  const voucher = await prisma.voucher.findUnique({
    where: { code: voucherCode },
    include: {
      customer: true,
      reward: true,
    }
  });
  
  if (!voucher) {
    throw new Error('Voucher not found');
  }
  
  if (voucher.status !== 'active') {
    throw new Error('Voucher is not active');
  }
  
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    throw new Error('Voucher has expired');
  }
  
  const updatedVoucher = await prisma.voucher.update({
    where: { id: voucher.id },
    data: {
      status: 'used',
      usedAt: new Date(),
    },
    include: {
      customer: true,
      reward: true,
    }
  });
  
  return updatedVoucher;
}

/**
 * Check if a voucher is valid
 */
export async function validateVoucher(voucherCode: string): Promise<{
  isValid: boolean;
  voucher?: any;
  error?: string;
}> {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
      include: {
        customer: true,
        reward: true,
      }
    });
    
    if (!voucher) {
      return { isValid: false, error: 'Voucher not found' };
    }
    
    if (voucher.status !== 'active') {
      return { isValid: false, error: 'Voucher is not active' };
    }
    
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return { isValid: false, error: 'Voucher has expired' };
    }
    
    return { isValid: true, voucher };
  } catch (error) {
    return { isValid: false, error: 'Error validating voucher' };
  }
}

/**
 * Check and update expired vouchers
 */
export async function checkAndUpdateExpiredVouchers(): Promise<{
  updatedCount: number;
  expiredVouchers: any[];
}> {
  try {
    const now = new Date();
    
    // Find all active vouchers that have expired
    const expiredVouchers = await prisma.voucher.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            points: true,
          }
        }
      }
    });
    
    if (expiredVouchers.length === 0) {
      return { updatedCount: 0, expiredVouchers: [] };
    }
    
    // Update all expired vouchers to expired status
    const updateResult = await prisma.voucher.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: 'expired'
      }
    });
    
    return {
      updatedCount: updateResult.count,
      expiredVouchers
    };
  } catch (error) {
    console.error('Error checking expired vouchers:', error);
    return { updatedCount: 0, expiredVouchers: [] };
  }
}

/**
 * Get voucher with automatic expiration check
 */
export async function getVoucherWithExpirationCheck(voucherCode: string): Promise<{
  voucher?: any;
  error?: string;
  wasExpired?: boolean;
}> {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            points: true,
          }
        },
        redemption: {
          select: {
            id: true,
            points: true,
            createdAt: true,
          }
        }
      }
    });
    
    if (!voucher) {
      return { error: 'Voucher not found' };
    }
    
    // Check if voucher is expired and update if necessary
    if (voucher.status === 'active' && voucher.expiresAt && voucher.expiresAt < new Date()) {
      const updatedVoucher = await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'expired' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          reward: {
            select: {
              id: true,
              name: true,
              description: true,
              points: true,
            }
          },
          redemption: {
            select: {
              id: true,
              points: true,
              createdAt: true,
            }
          }
        }
      });
      
      return { voucher: updatedVoucher, wasExpired: true };
    }
    
    return { voucher };
  } catch (error) {
    console.error('Error getting voucher with expiration check:', error);
    return { error: 'Error retrieving voucher' };
  }
} 