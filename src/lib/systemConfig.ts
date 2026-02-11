import { prisma } from './prisma';

export interface SystemConfig {
  pointFaceValue: number;
  platformReward: number;
  systemFixedCharge: number;
  systemVariableCharge: number;
}

// Get system configuration (with caching)
let cachedConfig: SystemConfig | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function getSystemConfig(): Promise<SystemConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (cachedConfig && (now - lastFetch) < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const config = await prisma.systemConfig.findFirst();
    
    if (config) {
      cachedConfig = {
        pointFaceValue: config.pointFaceValue,
        platformReward: config.platformReward || 0.007,
        systemFixedCharge: config.systemFixedCharge,
        systemVariableCharge: config.systemVariableCharge,
      };
    } else {
      // Use defaults if no config found
      cachedConfig = {
        pointFaceValue: 0.008,
        platformReward: 0.007,
        systemFixedCharge: 0.01,
        systemVariableCharge: 0.06,
      };
    }
    
    lastFetch = now;
    return cachedConfig;
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Return defaults on error
    return {
      pointFaceValue: 0.008,
      platformReward: 0.007,
      systemFixedCharge: 0.01,
      systemVariableCharge: 0.06,
    };
  }
}

// Calculate points issue charge
// Formula: [(Points * (Customer Reward + Platform Reward)) + (Points * System Fixed Charge)] * (1 + System Variable Charge)
export function calculatePointsIssueCharge(
  points: number,
  config: SystemConfig
): number {
  const customerAndPlatformReward = points * (config.pointFaceValue + config.platformReward);
  const fixedCharge = points * config.systemFixedCharge;
  const subtotal = customerAndPlatformReward + fixedCharge;
  const total = subtotal * (1 + config.systemVariableCharge);
  
  return Number(total.toFixed(4)); // Return with 4 decimal places
}

// Clear cache (useful after config updates)
export function clearSystemConfigCache() {
  cachedConfig = null;
  lastFetch = 0;
}







