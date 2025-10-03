export interface PointsTier {
  minAmount: number;
  maxAmount?: number;
  pointsPerPound: number;
  description: string;
}

export interface BonusRule {
  type: 'DAY_OF_WEEK' | 'DATE_RANGE' | 'MINIMUM_SPEND' | 'BANK_HOLIDAY';
  multiplier: number;
  conditions: {
    daysOfWeek?: number[];  // 0 = Sunday, 6 = Saturday
    startDate?: Date;
    endDate?: Date;
    minimumSpend?: number;
  };
  description: string;
}

export interface TenantPointsConfig {
  basePointsPerPound: number;
  tiers: PointsTier[];
  bonusRules: BonusRule[];
  roundingRule: 'PENNY' | 'FIVE_PENCE' | 'TEN_PENCE' | 'POUND';
  minimumSpend: number;
  roundPointsUp: boolean; // Whether to round points up to nearest whole number
  bankHolidayBonus: number; // Multiplier for bank holidays
}

// Helper function to round amount to nearest penny, 5p, 10p, or pound
export const roundAmount = (amount: number, rule: TenantPointsConfig['roundingRule']): number => {
  switch (rule) {
    case 'PENNY':
      return Math.round(amount * 100) / 100;
    case 'FIVE_PENCE':
      return Math.round(amount * 20) / 20;
    case 'TEN_PENCE':
      return Math.round(amount * 10) / 10;
    case 'POUND':
      return Math.round(amount);
    default:
      return Math.round(amount * 100) / 100;
  }
};

// Default configuration with UK-appropriate values
export const defaultPointsConfig: TenantPointsConfig = {
  basePointsPerPound: 10,
  tiers: [
    {
      minAmount: 0,
      maxAmount: 30,  // £30
      pointsPerPound: 10,
      description: 'Standard Tier'
    },
    {
      minAmount: 30.01,
      maxAmount: 75,  // £75
      pointsPerPound: 12,
      description: 'Silver Tier'
    },
    {
      minAmount: 75.01,
      pointsPerPound: 15,
      description: 'Gold Tier'
    }
  ],
  bonusRules: [
    {
      type: 'DAY_OF_WEEK',
      multiplier: 2,
      conditions: {
        daysOfWeek: [2], // Double points on Tuesdays
      },
      description: 'Double Point Tuesdays'
    },
    {
      type: 'MINIMUM_SPEND',
      multiplier: 1.5,
      conditions: {
        minimumSpend: 150, // £150
      },
      description: '50% Bonus Points on purchases over £150'
    },
    {
      type: 'BANK_HOLIDAY',
      multiplier: 2,
      conditions: {},
      description: 'Double Points on Bank Holidays'
    }
  ],
  roundingRule: 'PENNY',
  minimumSpend: 0,
  roundPointsUp: true,
  bankHolidayBonus: 2
};

export const BONUS_RULES = [
  {
    id: 'bonus_150',
    name: '50% Bonus Points',
    description: '50% Bonus Points on purchases over £150',
    condition: (amount: number) => amount >= 150,
    bonus: (basePoints: number) => Math.floor(basePoints * 0.5)
  },
  // Add more bonus rules here
]; 