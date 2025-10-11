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

    return NextResponse.json(config);
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
    const { pointFaceValue, systemFixedCharge, systemVariableCharge } = data;

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

    return NextResponse.json({
      message: 'System configuration updated successfully',
      config,
    });
  } catch (error: any) {
    console.error('Error updating system config:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

