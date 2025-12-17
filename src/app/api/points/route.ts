import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { pointsUtil } from "@/lib/pointsUtil";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const tenantId = searchParams.get("tenantId");
  const debug = searchParams.get("debug");

  // If customerId and tenantId are provided, return transactions
  if (customerId && tenantId) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get transactions from database
      const transactions = await prisma.transaction.findMany({
        where: {
          customerId,
          tenantId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Error fetching transactions" },
        { status: 500 }
      );
    }
  }

  // Debug endpoint to get detailed points breakdown
  if (debug === "true") {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const customer = await prisma.customer.findUnique({
        where: { email: session.user.email },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      const breakdown = await pointsUtil.getCustomerPointsBreakdown(
        customer.id
      );

      return NextResponse.json({
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
        pointsBreakdown: breakdown,
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      return NextResponse.json(
        { error: "Failed to get debug info" },
        { status: 500 }
      );
    }
  }

  // Otherwise, return points for the current user
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    console.log(
      "Points API - User:",
      session.user.email,
      "Current points:",
      customer.points
    );

    // Calculate points from approved and void transactions (excluding pending)
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["APPROVED", "VOID"] },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const calculatedPoints = transactions.reduce((total: number, t: any) => {
      if (t.type === "EARNED" || t.status === "VOID") return total + t.points;
      if (t.type === "SPENT" || t.type === "REFUND") return total + t.points; // SPENT/REFUND already negative
      return total;
    }, 0);

    // Always use calculated points from transactions
    // Ensure points never go below 0
    const finalPoints = Math.max(0, calculatedPoints);

    const response = {
      points: finalPoints,
      tier: calculateTier(finalPoints),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { points, action } = await request.json();

  if (!points || !action) {
    return NextResponse.json(
      { error: "Missing points or action" },
      { status: 400 }
    );
  }

  try {
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

    // Ensure customer has a corresponding User record for transactions
    const userId = await pointsUtil.ensureCustomerUserRecord(
      session.user.email,
      customer.name,
      customer.tenantId
    );

    let transactionPoints: number;
    let transactionType: string;

    if (action === "add") {
      transactionPoints = points;
      transactionType = "EARNED";
    } else if (action === "subtract") {
      // Validate the point transaction
      const validation = await pointsUtil.validatePointTransaction(
        customer.id,
        points
      );
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Insufficient points for deduction",
            details: {
              currentBalance: validation.currentBalance,
              pointsToDeduct: points,
              balanceAfterDeduction: validation.balanceAfterTransaction,
              validationError: validation.error,
            },
          },
          { status: 400 }
        );
      }

      transactionPoints = -points;
      transactionType = "SPENT";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Create a transaction record instead of updating customer points directly
    const transaction = await prisma.transaction.create({
      data: {
        amount: 0, // No monetary amount for manual points adjustment
        points: transactionPoints,
        type: transactionType,
        status: "APPROVED",
        userId: userId,
        customerId: customer.id,
        tenantId: customer.tenantId,
      },
    });

    // Calculate new points from transactions
    const newPoints = await pointsUtil.calculateCustomerPoints(customer.id);

    return NextResponse.json({
      points: newPoints,
      tier: calculateTier(newPoints),
      transaction: transaction,
    });
  } catch (error) {
    console.error("Error updating points:", error);
    return NextResponse.json(
      { error: "Failed to update points" },
      { status: 500 }
    );
  }
}

function calculateTier(points: number): string {
  if (points >= 1000) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Standard";
}
