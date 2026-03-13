import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateMobileToken } from '@/lib/auth/mobile-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mobileUser = await authenticateMobileToken(request);
    if (!mobileUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['PARTNER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(mobileUser.role?.toUpperCase())) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { action } = await request.json();
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: { status: newStatus },
      include: { customer: true },
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${action}d successfully`,
      transaction: {
        id: updated.id,
        status: updated.status,
        points: updated.points,
      },
    });
  } catch (error) {
    console.error('Error approving transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
