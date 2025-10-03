import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Admin API - User role:', session.user.role);
  console.log('Admin API - User email:', session.user.email);

  // Check if user has permission to view pending transactions
  const allowedRoles = ['PARTNER', 'ADMIN', 'SUPER_ADMIN'];
  if (!session.user.role || !allowedRoles.includes(session.user.role.toUpperCase())) {
    console.log('Admin API - Access denied for role:', session.user.role);
    return NextResponse.json({ 
      error: 'Access denied', 
      userRole: session.user.role,
      allowedRoles: allowedRoles 
    }, { status: 403 });
  }

  try {
    // Get pending transactions from the real database
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const formattedTransactions = pendingTransactions.map(transaction => ({
      id: transaction.id,
      customerEmail: transaction.customer.email,
      date: transaction.createdAt.toISOString(),
      points: transaction.points,
      description: `Transaction - £${transaction.amount.toFixed(2)}`,
      amount: transaction.amount,
      status: transaction.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      adminNotes: '', // This would need to be added to the Transaction model if needed
      customerName: transaction.customer.name,
      tenantName: transaction.tenant.name
    }));

    console.log(`Found ${formattedTransactions.length} pending transactions in database`);
    
    return NextResponse.json({ pendingTransactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch pending transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Admin API POST - User role:', session.user.role);
  console.log('Admin API POST - User email:', session.user.email);

  // Check if user has permission to view pending transactions
  const allowedRoles = ['PARTNER', 'ADMIN', 'SUPER_ADMIN'];
  if (!session.user.role || !allowedRoles.includes(session.user.role.toUpperCase())) {
    console.log('Admin API POST - Access denied for role:', session.user.role);
    return NextResponse.json({ 
      error: 'Access denied', 
      userRole: session.user.role,
      allowedRoles: allowedRoles 
    }, { status: 403 });
  }

  try {
    const { transactionId, action, adminNotes } = await request.json();

    if (!transactionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: true,
        user: true,
        tenant: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
    }

    // Update transaction status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      },
      include: {
        customer: true,
        user: true,
        tenant: true
      }
    });

    // If approved, add points to customer
    if (action === 'approve' && transaction.points > 0) {
      await prisma.customer.update({
        where: { id: transaction.customerId },
        data: {
          points: {
            increment: transaction.points
          }
        }
      });
    }

    return NextResponse.json({
      message: `Transaction ${action}d successfully`,
      transaction: {
        id: updatedTransaction.id,
        customerEmail: updatedTransaction.customer.email,
        date: updatedTransaction.createdAt.toISOString(),
        points: updatedTransaction.points,
        description: `Transaction - £${updatedTransaction.amount.toFixed(2)}`,
        amount: updatedTransaction.amount,
        status: updatedTransaction.status,
        adminNotes: adminNotes || ''
      }
    });

  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
} 