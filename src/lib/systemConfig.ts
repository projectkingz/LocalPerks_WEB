import { prisma } from './prisma';

export interface SystemConfig {
  pointFaceValue: number;
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
        systemFixedCharge: config.systemFixedCharge,
        systemVariableCharge: config.systemVariableCharge,
      };
    } else {
      // Use defaults if no config found
      cachedConfig = {
        pointFaceValue: 0.01,
        systemFixedCharge: 0.001,
        systemVariableCharge: 0.06,
      };
    }
    
    lastFetch = now;
    return cachedConfig;
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Return defaults on error
    return {
      pointFaceValue: 0.01,
      systemFixedCharge: 0.001,
      systemVariableCharge: 0.06,
    };
  }
}

// Calculate points issue charge
// Formula: (Points * Point Face Value + Points * System Fixed Cost) * (1 + System Variable Charge)
export function calculatePointsIssueCharge(
  points: number,
  config: SystemConfig
): number {
  const faceValueCost = points * config.pointFaceValue;
  const fixedCost = points * config.systemFixedCharge;
  const subtotal = faceValueCost + fixedCost;
  const total = subtotal * (1 + config.systemVariableCharge);
  
  return Number(total.toFixed(4)); // Return with 4 decimal places
}

// Clear cache (useful after config updates)
export function clearSystemConfigCache() {
  cachedConfig = null;
  lastFetch = 0;
}







