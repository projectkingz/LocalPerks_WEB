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
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { redemption: true, reward: true },
  });
  if (!voucher || !customer || voucher.customerId !== customer.id) {
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }
  if (
    voucher.status !== "active" ||
    voucher.usedAt ||
    (voucher.expiresAt && new Date(voucher.expiresAt) < new Date())
  ) {
    return NextResponse.json(
      { error: "Voucher cannot be cancelled" },
      { status: 400 }
    );
  }

  // Start transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Delete the voucher
      await tx.voucher.delete({ where: { id: voucherId } });
      // Recredit points to the customer
      await tx.customer.update({
        where: { id: voucher.customerId },
        data: { points: { increment: Math.abs(voucher.redemption.points) } },
      });
      // Create a transaction record
      console.log(
        "REDEEM_CANCEL points value:",
        voucher.redemption.points,
        "Math.abs(voucher.reward.points):",
        voucher.reward.points
      );
      await tx.transaction.create({
        data: {
          customerId: voucher.customerId,
          userId: userId,
          type: "REDEEM_CANCEL",
          points: voucher.reward.points,
          amount: 0,
          tenantId: voucher.reward.tenantId || customer.tenantId,
          status: "VOID",
        },
      });
      // Optionally, delete the redemption record
      await tx.redemption.delete({ where: { id: voucher.redemption.id } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to cancel redemption",
        details: err instanceof Error ? err.message : err,
      },
      { status: 500 }
    );
  }
}
