import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { pointsUtil } from "@/lib/pointsUtil";
import { authenticateMobileToken, createMobileSession } from "@/lib/auth/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    console.log('Points mobile: Request received');
    
    // Try mobile authentication first
    const mobileUser = await authenticateMobileToken(request);
    let session;
    
    if (mobileUser) {
      console.log('Points mobile: Mobile authentication successful for:', mobileUser.email);
      session = createMobileSession(mobileUser);
    } else {
      console.log('Points mobile: Mobile authentication failed, trying NextAuth session');
      // Fall back to NextAuth session
      session = await getServerSession(authOptions);
    }

    if (!session?.user?.email) {
      console.log('Points mobile: No valid session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('Points mobile: Authenticated user:', session.user.email, 'Role:', session.user.role);

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
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
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

function calculateTier(points: number): string {
  if (points >= 1000) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Standard";
}

