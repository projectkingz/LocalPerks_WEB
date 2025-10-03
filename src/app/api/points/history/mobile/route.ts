import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { authenticateMobileToken, createMobileSession } from "@/lib/auth/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    // Try mobile authentication first
    const mobileUser = await authenticateMobileToken(request);
    let session;
    
    if (mobileUser) {
      session = createMobileSession(mobileUser);
    } else {
      // Fall back to NextAuth session
      session = await getServerSession(authOptions);
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Points History API - User:', session.user.email);

    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get approved transactions (completed transactions)
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["APPROVED", "VOID"] },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 transactions for mobile
      include: {
        tenant: {
          select: {
            name: true,
          }
        }
      }
    });

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit pending transactions
      include: {
        tenant: {
          select: {
            name: true,
          }
        }
      }
    });

    // Format transactions for mobile
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      points: t.points,
      type: t.type,
      status: t.status,
      amount: t.amount,
      description: getTransactionDescription(t),
      merchant: t.tenant?.name || 'LocalPerks',
    }));

    const formattedPendingTransactions = pendingTransactions.map(t => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      points: t.points,
      type: t.type,
      status: t.status,
      amount: t.amount,
      description: getTransactionDescription(t),
      merchant: t.tenant?.name || 'LocalPerks',
    }));

    const response = {
      transactions: formattedTransactions,
      pendingTransactions: formattedPendingTransactions,
      total: formattedTransactions.length,
      pendingTotal: formattedPendingTransactions.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching points history:", error);
    return NextResponse.json(
      { error: "Failed to fetch points history" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function getTransactionDescription(transaction: any): string {
  const { type, points, amount } = transaction;
  
  if (type === 'EARNED') {
    if (amount > 0) {
      return `Purchase - $${amount.toFixed(2)}`;
    } else {
      return 'Points earned';
    }
  } else if (type === 'SPENT') {
    return 'Reward redemption';
  } else if (transaction.status === 'VOID') {
    return 'Transaction voided';
  }
  
  return 'Points transaction';
}

