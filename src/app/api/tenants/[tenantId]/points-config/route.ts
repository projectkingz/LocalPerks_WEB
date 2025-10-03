import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultPointsConfig } from '@/lib/pointsConfig';
import type { TenantPointsConfig, BonusRule } from '@/lib/pointsConfig';

// GET tenant's points configuration
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = params;

    const config = await prisma.tenantPointsConfig.findFirst({
      where: { tenantId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(config.config));
  } catch (error) {
    console.error('Error fetching points config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

// Update tenant's points configuration
export async function PUT(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = params;
    const configData = await request.json();

    // Validate the configuration data
    if (!configData.pointsPerDollar || !configData.minPurchase) {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 });
    }

    const config = await prisma.tenantPointsConfig.upsert({
      where: { tenantId },
      update: {
        config: JSON.stringify(configData),
      },
      create: {
        tenantId,
        config: JSON.stringify(configData),
      },
    });

    return NextResponse.json(JSON.parse(config.config));
  } catch (error) {
    console.error('Error updating points config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

// Validate points configuration
function validatePointsConfig(config: TenantPointsConfig): boolean {
  try {
    // Check required fields
    if (
      typeof config.basePointsPerPound !== 'number' ||
      !Array.isArray(config.tiers) ||
      !Array.isArray(config.bonusRules) ||
      typeof config.minimumSpend !== 'number' ||
      !['PENNY', 'FIVE_PENCE', 'TEN_PENCE', 'POUND'].includes(config.roundingRule) ||
      typeof config.roundPointsUp !== 'boolean' ||
      typeof config.bankHolidayBonus !== 'number'
    ) {
      return false;
    }

    // Validate tiers
    if (!config.tiers.every(tier => 
      typeof tier.minAmount === 'number' &&
      (tier.maxAmount === undefined || typeof tier.maxAmount === 'number') &&
      typeof tier.pointsPerPound === 'number' &&
      typeof tier.description === 'string'
    )) {
      return false;
    }

    // Validate bonus rules
    if (!config.bonusRules.every(rule => 
      ['DAY_OF_WEEK', 'DATE_RANGE', 'MINIMUM_SPEND', 'BANK_HOLIDAY'].includes(rule.type) &&
      typeof rule.multiplier === 'number' &&
      typeof rule.description === 'string' &&
      validateBonusRuleConditions(rule)
    )) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function validateBonusRuleConditions(rule: BonusRule): boolean {
  switch (rule.type) {
    case 'DAY_OF_WEEK':
      return Array.isArray(rule.conditions.daysOfWeek) &&
        rule.conditions.daysOfWeek.every(day => 
          typeof day === 'number' && day >= 0 && day <= 6
        );

    case 'DATE_RANGE':
      return rule.conditions.startDate instanceof Date &&
        rule.conditions.endDate instanceof Date &&
        rule.conditions.startDate <= rule.conditions.endDate;

    case 'MINIMUM_SPEND':
      return typeof rule.conditions.minimumSpend === 'number' &&
        rule.conditions.minimumSpend >= 0;

    case 'BANK_HOLIDAY':
      return true; // No additional conditions needed for bank holidays

    default:
      return false;
  }
} 