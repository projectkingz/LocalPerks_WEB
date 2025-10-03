import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Individual reward API: Starting GET request for ID:', params.id);
    
    const { id } = params;
    const reward = await prisma.reward.findUnique({ where: { id } });
    
    if (!reward) {
      console.log('Individual reward API: Reward not found for ID:', id);
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
    
    console.log('Individual reward API: Successfully found reward:', reward.id);
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
    console.log('Individual reward API: Starting PUT request for ID:', params.id);
    
    const { id } = params;
    const { name, description, points } = await request.json();
    
    console.log('Individual reward API: Updating reward with data:', { name, description, points });
    
    if (!name || !description || !points) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        description,
        points: parseInt(points),
      },
    });
    
    console.log('Individual reward API: Successfully updated reward:', reward.id);
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
    console.log('Individual reward API: Starting POST request for ID:', params.id);
    
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
    
    console.log('Individual reward API: Successfully created redemption:', redemption.id);
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
