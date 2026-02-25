import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const voucherId = params.id;

  // Get the customer record for the current user
  const customer = await prisma.customer.findUnique({
    where: { email: session.user.email },
  });

  // Fetch the voucher and check eligibility
  const voucher = await (prisma as any).voucher.findUnique({
    where: { id: voucherId },
    include: { redemption: true, reward: true },
  });
  
  if (!voucher) {
    console.log(`Cancel voucher: Voucher ${voucherId} not found`);
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }
  
  if (!customer) {
    console.log(`Cancel voucher: Customer not found for ${session.user.email}`);
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  
  if (voucher.customerId !== customer.id) {
    console.log(`Cancel voucher: Voucher ${voucherId} belongs to customer ${voucher.customerId}, but current customer is ${customer.id}`);
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }
  
  // Check cancellation eligibility with detailed logging
  const statusCheck = voucher.status !== "active";
  const usedCheck = !!voucher.usedAt;
  const expiredCheck = voucher.expiresAt && new Date(voucher.expiresAt) < new Date();
  
  if (statusCheck || usedCheck || expiredCheck) {
    console.log(`Cancel voucher: Cannot cancel voucher ${voucherId}`, {
      status: voucher.status,
      statusCheck,
      usedAt: voucher.usedAt,
      usedCheck,
      expiresAt: voucher.expiresAt,
      expiredCheck,
      customerId: voucher.customerId,
      redemptionPoints: voucher.redemption?.points
    });
    return NextResponse.json(
      { 
        error: "Voucher cannot be cancelled",
        details: {
          status: voucher.status,
          used: !!voucher.usedAt,
          expired: expiredCheck
        }
      },
      { status: 400 }
    );
  }

  // Check if redemption exists
  if (!voucher.redemption) {
    console.log(`Cancel voucher: Voucher ${voucherId} has no redemption record`);
    return NextResponse.json(
      { error: "Voucher redemption record not found" },
      { status: 400 }
    );
  }

  // Start transaction
  try {
    await prisma.$transaction(async (tx: any) => {
      const pointsToRefund = Math.abs(voucher.redemption.points || 0);
      
      console.log(
        "REDEEM_CANCEL:",
        {
          voucherId,
          redemptionId: voucher.redemption.id,
          points: voucher.redemption.points,
          pointsToRefund,
          customerId: voucher.customerId
        }
      );
      
      // Recredit points to the customer (even if 0, this is safe)
      if (pointsToRefund > 0) {
        await tx.customer.update({
          where: { id: voucher.customerId },
          data: { points: { increment: pointsToRefund } },
        });
      }
      
      // Create a transaction record (even for 0 points, to maintain audit trail)
      await tx.transaction.create({
        data: {
          customerId: voucher.customerId,
          userId: userId,
          type: "REDEEM_CANCEL",
          points: pointsToRefund,
          amount: 0,
          tenantId: voucher.reward?.tenantId || customer.tenantId,
          status: "VOID",
        },
      });
      
      // Delete the redemption record
      await tx.redemption.delete({ where: { id: voucher.redemption.id } });
      
      // Delete the voucher
      await tx.voucher.delete({ where: { id: voucherId } });
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Voucher cancelled successfully"
    });
  } catch (err) {
    console.error(`Cancel voucher: Transaction failed for voucher ${voucherId}:`, err);
    return NextResponse.json(
      {
        error: "Failed to cancel redemption",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
