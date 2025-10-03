import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { approvalStatus } = await request.json();
    const userId = params.id;

    // Get the user to check if they're a partner
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only partners can have approval status changed
    if (user.role !== 'PARTNER') {
      return NextResponse.json({ error: 'Only partner accounts can be approved' }, { status: 400 });
    }

    // Update the user's approval status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        approvalStatus: approvalStatus,
        // If approving, also ensure they're not suspended
        suspended: approvalStatus === 'ACTIVE' ? false : user.suspended
      },
    });

    return NextResponse.json({
      message: 'Partner approval status updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus,
        suspended: updatedUser.suspended,
      }
    });
  } catch (error) {
    console.error('Error updating partner approval status:', error);
    return NextResponse.json(
      { error: 'Failed to update partner approval status' },
      { status: 500 }
    );
  }
} 