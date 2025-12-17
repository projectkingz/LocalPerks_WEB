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

    // Get all available rewards from all tenants (no tenant filtering for customers)
    const rewards = await prisma.reward.findMany({
      orderBy: {
        points: "asc", // points field, not pointsRequired
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Get customer's current points
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["APPROVED", "VOID"] },
      },
    });

    const currentPoints = Math.max(0, transactions.reduce((total, t) => {
      if (t.type === "EARNED" || t.status === "VOID") return total + t.points;
      if (t.type === "SPENT") return total + t.points;
      return total;
    }, 0));

    // Get customer's vouchers (redeemed rewards)
    const vouchers = await prisma.voucher.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit for mobile
      include: {
        reward: {
          select: {
            name: true,
            description: true,
            tenant: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // Format rewards for mobile
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      title: reward.name, // name field in schema
      description: reward.description,
      pointsRequired: reward.points, // points field in schema
      merchant: reward.tenant?.name || 'LocalPerks',
      canRedeem: currentPoints >= reward.points,
      createdAt: reward.createdAt.toISOString(),
      tenant: {
        id: reward.tenant?.id,
        name: reward.tenant?.name || 'LocalPerks'
      }
    }));

    // Format vouchers for mobile
    const formattedVouchers = vouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      status: voucher.status,
      expiresAt: voucher.expiresAt?.toISOString(),
      usedAt: voucher.usedAt?.toISOString(),
      createdAt: voucher.createdAt.toISOString(),
      reward: {
        title: voucher.reward.name, // name field in schema
        description: voucher.reward.description,
        tenant: {
          id: voucher.reward.tenant?.id,
          name: voucher.reward.tenant?.name || 'LocalPerks'
        }
      },
      merchant: voucher.reward.tenant?.name || 'LocalPerks',
    }));

    const response = {
      currentPoints,
      rewards: formattedRewards,
      vouchers: formattedVouchers,
      availableRewards: formattedRewards.filter(r => r.canRedeem).length,
      totalVouchers: formattedVouchers.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
// Note: CORS headers are handled by next.config.js headers() function
// This OPTIONS handler is kept for compatibility but should match config
export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app')
    : (process.env.NEXT_PUBLIC_APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}
