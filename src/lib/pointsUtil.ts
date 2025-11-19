import { defaultPointsConfig, TenantPointsConfig, PointsTier, BonusRule, roundAmount } from './pointsConfig';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PointTransaction {
  customerId: string;
  tenantId: string;
  amount?: number;
  points: number;
  type: 'POINTS_EARNED' | 'POINTS_SPENT';
  date?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  qrCode: string;
  points: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  qrCode: string;
}

interface PointsCalculationResult {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  appliedRules: string[];
}

// UK Bank Holidays 2024 (update yearly)
const UK_BANK_HOLIDAYS_2024 = [
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-03-29'), // Good Friday
  new Date('2024-04-01'), // Easter Monday
  new Date('2024-05-06'), // Early May Bank Holiday
  new Date('2024-05-27'), // Spring Bank Holiday
  new Date('2024-08-26'), // Summer Bank Holiday
  new Date('2024-12-25'), // Christmas Day
  new Date('2024-12-26'), // Boxing Day
];

// Helper function to check if a date is a UK bank holiday
const isUKBankHoliday = (date: Date): boolean => {
  return UK_BANK_HOLIDAYS_2024.some(holiday => 
    holiday.getDate() === date.getDate() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getFullYear() === date.getFullYear()
  );
};

// Helper function to format amount in GBP with proper rounding
export function formatGBP(amount: number, roundingRule: TenantPointsConfig['roundingRule'] = 'PENNY'): string {
  const roundedAmount = roundAmount(amount, roundingRule);
  return `£${roundedAmount.toFixed(2)}`;
}

export interface CustomerDetails {
  customer: Customer;
  pointBalance: number;
  transactions: any[]; // Empty array type since we removed history
}

export const pointsUtil = {
  // Get the applicable tier for a given amount
  getApplicableTier(amount: number, tiers: PointsTier[]): PointsTier {
    return tiers
      .sort((a, b) => b.minAmount - a.minAmount)
      .find(tier => amount >= tier.minAmount) || tiers[0];
  },

  // Calculate bonus multiplier based on rules
  calculateBonusMultiplier(
    amount: number,
    date: Date,
    rules: BonusRule[]
  ): { multiplier: number; appliedRules: string[] } {
    let finalMultiplier = 1;
    const appliedRules: string[] = [];

    // Check for bank holiday first
    if (isUKBankHoliday(date)) {
      const bankHolidayRule = rules.find(rule => rule.type === 'BANK_HOLIDAY');
      if (bankHolidayRule) {
        finalMultiplier *= bankHolidayRule.multiplier;
        appliedRules.push(bankHolidayRule.description);
      }
    }

    rules.forEach(rule => {
      if (rule.type === 'BANK_HOLIDAY') return; // Skip as we handled it above

      let applies = false;

      switch (rule.type) {
        case 'DAY_OF_WEEK':
          if (rule.conditions.daysOfWeek?.includes(date.getDay())) {
            applies = true;
          }
          break;

        case 'DATE_RANGE':
          if (rule.conditions.startDate && rule.conditions.endDate) {
            const startDate = new Date(rule.conditions.startDate);
            const endDate = new Date(rule.conditions.endDate);
            if (date >= startDate && date <= endDate) {
              applies = true;
            }
          }
          break;

        case 'MINIMUM_SPEND':
          if (rule.conditions.minimumSpend && amount >= rule.conditions.minimumSpend) {
            applies = true;
          }
          break;
      }

      if (applies) {
        finalMultiplier *= rule.multiplier;
        appliedRules.push(rule.description);
      }
    });

    return { multiplier: finalMultiplier, appliedRules };
  },

  // Calculate points based on amount and configuration
  calculatePoints(
    amount: number,
    config: TenantPointsConfig = defaultPointsConfig,
    date: Date = new Date()
  ): PointsCalculationResult {
    // Round the amount according to the tenant's rounding rule
    const roundedAmount = roundAmount(amount, config.roundingRule);

    // Check minimum spend
    if (roundedAmount < config.minimumSpend) {
      return {
        basePoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
        appliedRules: [`Purchase amount below minimum spend of ${formatGBP(config.minimumSpend, config.roundingRule)}`]
      };
    }

    // Get applicable tier
    const tier = this.getApplicableTier(roundedAmount, config.tiers);
    const basePoints = roundedAmount * tier.pointsPerPound;

    // Calculate bonus multiplier
    const { multiplier, appliedRules } = this.calculateBonusMultiplier(
      roundedAmount,
      date,
      config.bonusRules
    );

    // Calculate total points with bonuses
    const totalBeforeRounding = basePoints * multiplier;

    // Apply points rounding according to config
    let totalPoints: number;
    if (config.roundPointsUp) {
      totalPoints = Math.ceil(totalBeforeRounding);
    } else {
      totalPoints = Math.floor(totalBeforeRounding);
    }

    const bonusPoints = totalPoints - Math.floor(basePoints);

    return {
      basePoints: Math.floor(basePoints),
      bonusPoints,
      totalPoints,
      appliedRules: [
        `${tier.description}: ${tier.pointsPerPound} points per ${formatGBP(1, config.roundingRule)}`,
        ...appliedRules
      ]
    };
  },

  // Process a purchase and award points
  async processPurchase(
    qrCode: string,
    amount: number,
    tenantId: string,
    purchaseDate: Date = new Date()
  ): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      // First, get customer by QR code using lookup endpoint
      const customerResponse = await fetch(`/api/customers/qr/lookup?qrCode=${encodeURIComponent(qrCode)}`);
      if (!customerResponse.ok) {
        throw new Error('Customer not found');
      }
      const responseData = await customerResponse.json();
      const customer: Customer = responseData.customer;

      // Get tenant's points configuration
      const configResponse = await fetch(`/api/tenants/${tenantId}/points-config`);
      const config: TenantPointsConfig = configResponse.ok 
        ? await configResponse.json()
        : defaultPointsConfig;

      // Round the amount according to tenant's rounding rule
      const roundedAmount = roundAmount(amount, config.roundingRule);

      // Calculate points with bonuses
      const { totalPoints, appliedRules } = this.calculatePoints(roundedAmount, config, purchaseDate);

      // Create the points transaction
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          tenantId,
          amount: roundedAmount,
          points: totalPoints,
          type: 'POINTS_EARNED',
          date: purchaseDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process purchase');
      }

      const result = await response.json();
      
      // Return success message with applied rules
      const rulesMessage = appliedRules.length 
        ? `\n${appliedRules.join('\n')}`
        : '';
      const message = `Successfully awarded ${totalPoints} points for ${formatGBP(roundedAmount, config.roundingRule)}!${rulesMessage}`;

      return { 
        success: true,
        message,
        data: { 
          ...result,
          pointsBreakdown: {
            totalPoints,
            appliedRules
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process purchase'
      };
    }
  },

  // Process a reward redemption
  async redeemReward(
    customerQrCode: string,
    rewardQrCode: string,
    tenantId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get customer by QR code using lookup endpoint
      const customerResponse = await fetch(`/api/customers/qr/lookup?qrCode=${encodeURIComponent(customerQrCode)}`);
      if (!customerResponse.ok) {
        throw new Error('Customer not found');
      }
      const responseData = await customerResponse.json();
      const customer: Customer = responseData.customer;

      // Get reward by QR code
      const rewardResponse = await fetch(`/api/rewards/qr/${rewardQrCode}`);
      if (!rewardResponse.ok) {
        throw new Error('Reward not found');
      }
      const reward: Reward = await rewardResponse.json();

      // Check if customer has enough points
      if (customer.points < reward.pointsCost) {
        throw new Error(`Insufficient points for this reward (${reward.pointsCost} points required)`);
      }

      // Create the redemption transaction
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          tenantId,
          points: -reward.pointsCost,
          type: 'POINTS_SPENT',
          date: new Date()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem reward');
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get customer's point balance and transaction history
  async getCustomerPoints(
    qrCode: string,
    tenantId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get customer by QR code using lookup endpoint
      const customerResponse = await fetch(`/api/customers/qr/lookup?qrCode=${encodeURIComponent(qrCode)}`);
      if (!customerResponse.ok) {
        throw new Error('Customer not found');
      }
      const responseData = await customerResponse.json();
      const customer: Customer = responseData.customer;

      // Get transaction history
      const historyResponse = await fetch(
        `/api/points?customerId=${customer.id}&tenantId=${tenantId}`
      );
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const history = await historyResponse.json();

      return {
        success: true,
        data: {
          customer,
          currentPoints: customer.points,
          transactions: history
        }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCustomerDetails(customerId: string): Promise<CustomerDetails> {
    try {
      // Get customer profile
      const customerResponse = await fetch(`/api/customers/${customerId}`);
      if (!customerResponse.ok) {
        throw new Error('Failed to fetch customer details');
      }
      const customer = await customerResponse.json();

      // Get point balance
      const pointsResponse = await fetch(`/api/points/balance/${customerId}`);
      if (!pointsResponse.ok) {
        throw new Error('Failed to fetch points balance');
      }
      const { balance } = await pointsResponse.json();

      return {
        customer,
        pointBalance: balance,
        transactions: [] // Empty array since we removed history
      };
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      throw error;
    }
  },

  // Calculate customer points from transactions (consistent across app)
  async calculateCustomerPoints(customerId: string): Promise<number> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          customerId,
          status: { in: ['APPROVED', 'VOID'] },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Match web /api/points logic: include EARNED and any VOID (any type), and SPENT (negative)
      const calculatedPoints = transactions.reduce((total, t) => {
        if (t.type === 'EARNED' || t.status === 'VOID') return total + t.points;
        if (t.type === 'SPENT') return total + t.points; // SPENT already negative
        return total;
      }, 0);

      // Ensure points never go below 0
      return Math.max(0, calculatedPoints);
    } catch (error) {
      console.error('Error calculating customer points:', error);
      return 0;
    }
  },

  // Get customer points with detailed breakdown for debugging
  async getCustomerPointsBreakdown(customerId: string): Promise<{
    storedPoints: number;
    calculatedPoints: number;
    actualPoints: number;
    transactions: any[];
  }> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          customerId,
          status: { in: ['APPROVED', 'VOID'] },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Match web calculation rules
      const calculatedPoints = transactions.reduce((total, t) => {
        if (t.type === 'EARNED' || t.status === 'VOID') return total + t.points;
        if (t.type === 'SPENT') return total + t.points;
        return total;
      }, 0);

      // Always use calculated points from transactions, not stored points
      // Ensure points never go below 0
      const actualPoints = Math.max(0, calculatedPoints);

      return {
        storedPoints: customer.points,
        calculatedPoints,
        actualPoints,
        transactions
      };
    } catch (error) {
      console.error('Error getting customer points breakdown:', error);
      throw error;
    }
  },

  // Ensure customer has corresponding User record
  async ensureCustomerUserRecord(customerEmail: string, customerName?: string, tenantId?: string): Promise<string> {
    try {
      let user = await prisma.user.findUnique({
        where: { email: customerEmail }
      });

      if (!user) {
        console.log('Creating User record for customer:', customerEmail);
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: customerName || customerEmail.split('@')[0],
            role: 'customer',
            tenantId: tenantId || 'default'
          }
        });
        console.log('Created User record with ID:', user.id);
      }

      return user.id;
    } catch (error) {
      console.error('Error ensuring customer user record:', error);
      throw error;
    }
  },

  // Validate that a point transaction won't result in negative balance
  async validatePointTransaction(customerId: string, pointsToDeduct: number): Promise<{
    isValid: boolean;
    currentBalance: number;
    balanceAfterTransaction: number;
    error?: string;
  }> {
    try {
      const currentBalance = await this.calculateCustomerPoints(customerId);
      const balanceAfterTransaction = currentBalance - pointsToDeduct;

      if (balanceAfterTransaction < 0) {
        return {
          isValid: false,
          currentBalance,
          balanceAfterTransaction,
          error: `Transaction would result in negative balance. Current: ${currentBalance}, Deduction: ${pointsToDeduct}, Result: ${balanceAfterTransaction}`
        };
      }

      return {
        isValid: true,
        currentBalance,
        balanceAfterTransaction
      };
    } catch (error) {
      console.error('Error validating point transaction:', error);
      return {
        isValid: false,
        currentBalance: 0,
        balanceAfterTransaction: 0,
        error: 'Error validating transaction'
      };
    }
  }
}; 