import { prisma } from '@/lib/prisma';
import { defaultPointsConfig, TenantPointsConfig } from './pointsConfig';

/**
 * Get tenant-specific points configuration
 * Falls back to default configuration if tenant config doesn't exist
 */
export async function getTenantPointsConfig(tenantId: string): Promise<TenantPointsConfig> {
  try {
    const config = await prisma.tenantPointsConfig.findFirst({
      where: { tenantId },
    });

    if (config && config.config) {
      const parsedConfig = JSON.parse(config.config);
      // Merge with defaults to ensure all required fields exist
      return {
        ...defaultPointsConfig,
        ...parsedConfig,
      };
    }
  } catch (error) {
    console.error('Error fetching tenant points config:', error);
  }

  // Return default configuration if no tenant-specific config exists
  return defaultPointsConfig;
}

/**
 * Calculate points based on amount and tenant-specific configuration
 * Uses tier-based calculation if configured, otherwise uses base rate
 */
export function calculatePointsWithConfig(
  amount: number,
  config: TenantPointsConfig
): number {
  // Find applicable tier
  const applicableTier = config.tiers.find(
    (tier) =>
      amount >= tier.minAmount &&
      (tier.maxAmount === undefined || amount <= tier.maxAmount)
  );

  // Use tier-specific rate or fall back to base rate
  const pointsPerPound = applicableTier?.pointsPerPound || config.basePointsPerPound;

  // Calculate base points
  let points = Math.floor(amount * pointsPerPound);

  // Apply bonus rules if applicable
  const now = new Date();
  const dayOfWeek = now.getDay();

  for (const rule of config.bonusRules) {
    let applyBonus = false;

    switch (rule.type) {
      case 'DAY_OF_WEEK':
        if (rule.conditions.daysOfWeek?.includes(dayOfWeek)) {
          applyBonus = true;
        }
        break;

      case 'DATE_RANGE':
        if (rule.conditions.startDate && rule.conditions.endDate) {
          const start = new Date(rule.conditions.startDate);
          const end = new Date(rule.conditions.endDate);
          if (now >= start && now <= end) {
            applyBonus = true;
          }
        }
        break;

      case 'MINIMUM_SPEND':
        if (rule.conditions.minimumSpend && amount >= rule.conditions.minimumSpend) {
          applyBonus = true;
        }
        break;

      case 'BANK_HOLIDAY':
        // Bank holiday detection could be implemented here
        // For now, skip this rule
        break;
    }

    if (applyBonus) {
      points = Math.floor(points * rule.multiplier);
    }
  }

  // Apply rounding if configured
  if (config.roundPointsUp) {
    points = Math.ceil(points);
  } else {
    points = Math.floor(points);
  }

  return points;
}

/**
 * Simple points calculation with just a rate (for backward compatibility)
 */
export function calculatePoints(amount: number, pointsPerPound: number = 5): number {
  return Math.floor(amount * pointsPerPound);
}

/**
 * Calculate points for a transaction, loading tenant config automatically
 */
export async function calculatePointsForTransaction(
  amount: number,
  tenantId: string
): Promise<number> {
  const config = await getTenantPointsConfig(tenantId);
  return calculatePointsWithConfig(amount, config);
}

/**
 * Calculate the face value (monetary value) of points
 * @param points - Number of points
 * @param config - Tenant points configuration
 * @returns Face value in pounds (e.g., 100 points with 0.01 = £1.00)
 */
export function calculatePointsFaceValue(
  points: number,
  config: TenantPointsConfig
): number {
  return points * config.pointFaceValue;
}

/**
 * Calculate how many points are needed for a specific discount amount
 * @param discountAmount - Discount amount in pounds (e.g., 1 for £1)
 * @param config - Tenant points configuration
 * @returns Number of points required
 */
export function calculatePointsForDiscount(
  discountAmount: number,
  config: TenantPointsConfig
): number {
  return Math.ceil(discountAmount / config.pointFaceValue);
}

/**
 * Calculate platform charge for a transaction
 * @param amount - Transaction amount in pounds
 * @param config - Tenant points configuration
 * @returns Platform charge amount in pounds
 */
export function calculatePlatformCharge(
  amount: number,
  config: TenantPointsConfig
): number {
  return (amount * config.platformChargePercentage) / 100;
}

/**
 * Get available discount tiers for a given points balance
 * @param points - Customer's points balance
 * @param config - Tenant points configuration
 * @returns Array of discount amounts the customer can redeem
 */
export function getAvailableDiscounts(
  points: number,
  config: TenantPointsConfig
): number[] {
  const availableDiscounts: number[] = [];
  const maxDiscountPounds = Math.floor(calculatePointsFaceValue(points, config));
  
  // Generate discount tiers from £1 to £20
  for (let i = 1; i <= 20; i++) {
    if (i <= maxDiscountPounds) {
      availableDiscounts.push(i);
    }
  }
  
  return availableDiscounts;
}

