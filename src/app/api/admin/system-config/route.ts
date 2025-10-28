import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { prisma } from '@/lib/prisma';

// Helper to check super admin access
async function requireSuperAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }
  return session.user;
}

// GET - Fetch system configuration
export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the first (and only) system config, or create one with defaults
    let config = await prisma.systemConfig.findFirst();
    
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          pointFaceValue: 0.01,
          systemFixedCharge: 0.001,
          systemVariableCharge: 0.06,
        },
      });
    }

    // Get subscription tiers
    const subscriptionTiers = await prisma.subscriptionTier.findMany({
      orderBy: { price: 'asc' }
    });

    // If no tiers exist, create default ones
    if (subscriptionTiers.length === 0) {
      await prisma.subscriptionTier.createMany({
        data: [
          { name: 'BASIC', displayName: 'Basic', price: 19, isActive: true },
          { name: 'PLUS', displayName: 'Plus', price: 20, isActive: true },
          { name: 'PREMIUM', displayName: 'Premium', price: 21, isActive: true },
          { name: 'ELITE', displayName: 'Elite', price: 22, isActive: true },
        ]
      });
      
      const newTiers = await prisma.subscriptionTier.findMany({
        orderBy: { price: 'asc' }
      });
      
      return NextResponse.json({
        ...config,
        subscriptionTiers: newTiers
      });
    }

    return NextResponse.json({
      ...config,
      subscriptionTiers
    });
  } catch (error: any) {
    console.error('Error fetching system config:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT - Update system configuration
export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { pointFaceValue, systemFixedCharge, systemVariableCharge, subscriptionTiers } = data;

    // Validate inputs
    if (
      typeof pointFaceValue !== 'number' ||
      typeof systemFixedCharge !== 'number' ||
      typeof systemVariableCharge !== 'number' ||
      pointFaceValue <= 0 ||
      systemFixedCharge < 0 ||
      systemVariableCharge < 0
    ) {
      return NextResponse.json(
        { message: 'Invalid configuration values' },
        { status: 400 }
      );
    }

    // Validate subscription tiers if provided
    if (subscriptionTiers && Array.isArray(subscriptionTiers)) {
      for (const tier of subscriptionTiers) {
        if (
          typeof tier.name !== 'string' ||
          typeof tier.displayName !== 'string' ||
          typeof tier.price !== 'number' ||
          typeof tier.isActive !== 'boolean' ||
          tier.price < 0
        ) {
          return NextResponse.json(
            { message: 'Invalid subscription tier data' },
            { status: 400 }
          );
        }
      }
    }

    // Get existing config or create new one
    let config = await prisma.systemConfig.findFirst();

    if (config) {
      // Update existing config
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: {
          pointFaceValue,
          systemFixedCharge,
          systemVariableCharge,
        },
      });
    } else {
      // Create new config
      config = await prisma.systemConfig.create({
        data: {
          pointFaceValue,
          systemFixedCharge,
          systemVariableCharge,
        },
      });
    }

    // Update subscription tiers if provided
    if (subscriptionTiers && Array.isArray(subscriptionTiers)) {
      for (const tierData of subscriptionTiers) {
        await prisma.subscriptionTier.upsert({
          where: { name: tierData.name },
          update: {
            displayName: tierData.displayName,
            price: tierData.price,
            isActive: tierData.isActive,
          },
          create: {
            name: tierData.name,
            displayName: tierData.displayName,
            price: tierData.price,
            isActive: tierData.isActive,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'System configuration updated successfully',
      config,
    });
  } catch (error: any) {
    console.error('Error updating system config:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}



