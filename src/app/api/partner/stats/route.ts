import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getSystemConfig, calculatePointsIssueCharge } from '@/lib/systemConfig';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7'; // days

  try {
    const tenantId = session.user.tenantId;
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get system configuration
    const systemConfig = await getSystemConfig();

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: tenantId,
        type: 'EARNED',
        status: 'APPROVED',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        points: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const totalTransactions = transactions.length;
    const pointsIssued = transactions.reduce((sum, t) => sum + t.points, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Calculate total points issue charge
    const pointsIssueCharge = calculatePointsIssueCharge(pointsIssued, systemConfig);

    return NextResponse.json({
      period: periodDays,
      totalTransactions,
      pointsIssued,
      averageTransaction: Number(averageTransaction.toFixed(2)),
      pointsIssueCharge: Number(pointsIssueCharge.toFixed(2)),
      systemConfig: {
        pointFaceValue: systemConfig.pointFaceValue,
        systemFixedCharge: systemConfig.systemFixedCharge,
        systemVariableCharge: systemConfig.systemVariableCharge,
      },
    });
  } catch (error: any) {
    console.error('Error fetching partner stats:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

