import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view pending transactions
  const allowedRoles = ['PARTNER', 'ADMIN', 'SUPER_ADMIN'];
  const userRole = session.user.role?.toUpperCase();
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('Access denied for pending transactions:', {
      userEmail: session.user.email,
      userRole: session.user.role,
      allowedRoles: allowedRoles
    });
    return NextResponse.json({ 
      error: 'Access denied', 
      userRole: session.user.role,
      allowedRoles: allowedRoles 
    }, { status: 403 });
  }

  console.log('User authorized to view pending transactions:', {
    email: session.user.email,
    role: userRole
  });

  try {
    // Get pending transactions from the real database
    // MySQL string comparisons are case-insensitive by default
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

    console.log(`Query found ${pendingTransactions.length} transactions with status 'PENDING'`);
    if (pendingTransactions.length > 0) {
      console.log('Sample transaction statuses:', pendingTransactions.slice(0, 3).map(t => ({ id: t.id, status: t.status })));
    }

    // Transform the data to match the expected format
    const formattedTransactions = pendingTransactions.map((transaction: any) => ({
      id: transaction.id,
      customerEmail: transaction.customer.email,
      date: transaction.createdAt.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      points: transaction.points,
      description: transaction.description || `Receipt scan - £${transaction.amount.toFixed(2)}`,
      amount: transaction.amount,
      status: transaction.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      adminNotes: '', // This would need to be added to the Transaction model if needed
      customerName: transaction.customer.name,
      tenantName: transaction.tenant?.name || 'N/A',
      receiptImage: transaction.receiptImage || null
    }));

    console.log(`Found ${formattedTransactions.length} pending transactions in database`);
    console.log('Sample transaction:', formattedTransactions[0] ? {
      id: formattedTransactions[0].id,
      customerEmail: formattedTransactions[0].customerEmail,
      status: formattedTransactions[0].status,
      hasReceiptImage: !!formattedTransactions[0].receiptImage
    } : 'No transactions');
    
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

  // Check if user has permission to view pending transactions
  const allowedRoles = ['PARTNER', 'ADMIN', 'SUPER_ADMIN'];
  if (!session.user.role || !allowedRoles.includes(session.user.role.toUpperCase())) {
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