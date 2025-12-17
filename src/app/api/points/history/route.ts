import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { pointsUtil } from '@/lib/pointsUtil';
import { calculatePointsForTransaction } from '@/lib/pointsCalculation';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get user's transactions from the real database
    const transactions = await prisma.transaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: { 
        customerId: customer.id,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform transactions to match expected format
    const formattedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      date: transaction.createdAt.toISOString(),
      points: transaction.points,
      description: transaction.type === 'REFUND' 
        ? `Refund - £${Math.abs(transaction.amount).toFixed(2)}`
        : `Transaction - £${transaction.amount.toFixed(2)}`,
      type: transaction.type === 'EARNED' ? 'EARNED' : transaction.type === 'REFUND' ? 'REFUND' : 'SPENT',
      status: transaction.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      amount: transaction.amount
    }));

    const formattedPendingTransactions = pendingTransactions.map((transaction: any) => ({
      id: transaction.id,
      date: transaction.createdAt.toISOString(),
      points: transaction.points,
      description: transaction.type === 'REFUND' 
        ? `Refund - £${Math.abs(transaction.amount).toFixed(2)}`
        : `Transaction - £${transaction.amount.toFixed(2)}`,
      amount: transaction.amount,
      status: transaction.status as 'PENDING' | 'APPROVED' | 'REJECTED'
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pendingTransactions: formattedPendingTransactions
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { points, description, type, amount, receiptImage, isReceipt = false, source = 'customer' } = await request.json();

  if (!points || !description || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['EARNED', 'SPENT'].includes(type)) {
    return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
  }

  try {
    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // If this is a receipt upload from customer, create a pending transaction
    if (isReceipt && type === 'EARNED' && source === 'customer') {
      // Ensure customer has a corresponding User record for transactions
      const userId = await pointsUtil.ensureCustomerUserRecord(
        session.user.email, 
        customer.name, 
        customer.tenantId
      );

      const pendingTransaction = await prisma.transaction.create({
        data: {
          amount: amount || points,
          points: points,
          type: 'EARNED',
          status: 'PENDING',
          userId: userId,
          customerId: customer.id,
          tenantId: customer.tenantId,
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
          }
        }
      });

      return NextResponse.json({
        message: 'Receipt submitted for approval',
        transaction: {
          id: pendingTransaction.id,
          customerEmail: pendingTransaction.customer.email,
          date: pendingTransaction.createdAt.toISOString(),
          points: pendingTransaction.points,
          description: `Receipt scan - £${pendingTransaction.amount.toFixed(2)}`,
          amount: pendingTransaction.amount,
          status: 'PENDING'
        },
        status: 'PENDING'
      });
    }

    // For partner QR code scans or non-receipt transactions, create regular transaction and add points immediately
    const userId = await pointsUtil.ensureCustomerUserRecord(
      session.user.email, 
      customer.name, 
      customer.tenantId
    );

    const newTransaction = await prisma.transaction.create({
      data: {
        amount: amount || points,
        points: points,
        type: type,
        status: 'APPROVED',
        userId: userId,
        customerId: customer.id,
        tenantId: customer.tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    // If it's an EARNED transaction, add points to customer balance immediately
    if (type === 'EARNED') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          points: {
            increment: points
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Transaction recorded successfully',
      transaction: {
        id: newTransaction.id,
        customerEmail: newTransaction.customer.email,
        date: newTransaction.createdAt.toISOString(),
        points: newTransaction.points,
        description: `Transaction - £${newTransaction.amount.toFixed(2)}`,
        amount: newTransaction.amount,
        status: 'APPROVED'
      },
      status: 'APPROVED'
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
} 