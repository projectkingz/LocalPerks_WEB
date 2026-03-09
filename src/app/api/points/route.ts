import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
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
      logger.error("Error fetching transactions:", error);
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
      logger.error("Error in debug endpoint:", error);
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


    // Delegate to the shared utility so the calculation logic lives in one place.
    const finalPoints = await pointsUtil.calculateCustomerPoints(customer.id);

    const response = {
      points: finalPoints,
      tier: calculateTier(finalPoints),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching points:", error);
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

      // Store SPENT as a positive value — consistent with /api/discounts/redeem.
      // The reduce in GET (and pointsUtil.calculateCustomerPoints) normalizes sign via
      // `t.points <= 0 ? t.points : -t.points`, so positive SPENT is handled correctly.
      transactionPoints = points;
      transactionType = "SPENT";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Resolve tenantId — Transaction.tenantId is non-nullable in the schema.
    // Fall back to the system tenant if the customer has no tenant assignment.
    let transactionTenantId = customer.tenantId;
    if (!transactionTenantId) {
      let systemTenant = await prisma.tenant.findFirst({ where: { name: 'LocalPerks System' } });
      if (!systemTenant) {
        const systemUser = await prisma.user.upsert({
          where: { email: 'system@localperks.com' },
          create: {
            email: 'system@localperks.com',
            name: 'LocalPerks System',
            role: 'ADMIN',
            suspended: false,
          },
          update: {},
        });
        systemTenant = await prisma.tenant.create({
          data: {
            name: 'LocalPerks System',
            partnerUserId: systemUser.id,
            mobile: 'N/A',
          },
        });
      }
      transactionTenantId = systemTenant.id;
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
        tenantId: transactionTenantId,
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
    logger.error("Error updating points:", error);
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
