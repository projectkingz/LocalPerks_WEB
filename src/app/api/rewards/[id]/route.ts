import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const reward = await prisma.reward.findUnique({ where: { id } });
    
    if (!reward) {
      return NextResponse.json(
        {
          error: "Reward not found",
          debug: {
            requestedId: id,
            foundReward: reward,
          },
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reward);
  } catch (error) {
    console.error('Individual reward API: Error in GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'PARTNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { name, description, discountPercentage, validFrom, validTo, maxRedemptionsPerCustomer } = await request.json();
    
    // Check if reward exists and get its current status
    const existingReward = await prisma.reward.findUnique({
      where: { id }
    });
    
    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    // Prevent editing if reward is approved
    if (existingReward.approvalStatus === 'APPROVED') {
      return NextResponse.json({ 
        error: 'This voucher has been approved and cannot be edited. Please contact an administrator if you need to make changes.' 
      }, { status: 403 });
    }
    
    if (!name || !description || discountPercentage === undefined || !validFrom || !validTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // PARTNERS CAN ONLY CREATE/EDIT PERCENTAGE DISCOUNTS
    if (session.user.role === 'PARTNER') {
      // Partners must create percentage discounts only
      if (discountPercentage === 0 && name.match(/£\d+/)) {
        return NextResponse.json(
          { error: 'Partners can only create percentage discounts. Fixed amount discounts are only available to administrators.' },
          { status: 403 }
        );
      }
      // Validate percentage is between 0 and 100
      if (discountPercentage < 0 || discountPercentage > 100) {
        return NextResponse.json(
          { error: 'Discount percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }
    
    // Validate dates
    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (toDate < fromDate) {
      return NextResponse.json({ error: 'Valid To date must be after Valid From date' }, { status: 400 });
    }
    
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        description,
        discountPercentage: Number(discountPercentage),
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        maxRedemptionsPerCustomer: maxRedemptionsPerCustomer != null && maxRedemptionsPerCustomer !== '' ? Number(maxRedemptionsPerCustomer) : null,
      },
    });
    
    return NextResponse.json({
      message: "Reward updated successfully",
      reward,
    });
  } catch (error) {
    console.error('Individual reward API: Error in PUT:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { customerId, points } = await request.json();
    
    // Check reward exists
    const reward = await prisma.reward.findUnique({ where: { id: params.id } });
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }
    
    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    // Create redemption
    const redemption = await prisma.redemption.create({
      data: {
        rewardId: params.id,
        customerId,
        points: Number(points),
      },
    });
    
    return NextResponse.json({ message: "Reward redeemed successfully", redemption });
  } catch (error) {
    console.error('Individual reward API: Error in POST:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'PARTNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    await prisma.reward.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }
}
