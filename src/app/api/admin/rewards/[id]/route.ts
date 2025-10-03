import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, description, points, createdAt } = body;

    // Validate required fields
    if (!name || !description || points === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and points are required' },
        { status: 400 }
      );
    }

    // Validate points is a positive number
    if (points < 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      );
    }

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id }
    });

    if (!existingReward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        description,
        points: parseInt(points),
        createdAt: createdAt ? new Date(createdAt) : existingReward.createdAt,
      },
      include: {
        redemptions: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete rewards
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admins can delete rewards' }, { status: 403 });
    }

    const { id } = params;

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id },
      include: {
        redemptions: true
      }
    });

    if (!existingReward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    // Check if reward has redemptions
    if (existingReward.redemptions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete reward with existing redemptions' },
        { status: 400 }
      );
    }

    await prisma.reward.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 