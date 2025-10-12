import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  if (!isAdmin && !isSuperAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { approvalStatus } = await req.json();

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Permission check: Regular ADMIN can only manage CUSTOMER and PARTNER accounts
    if (isAdmin && !isSuperAdmin) {
      if (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { message: 'Only Super Admin can manage admin accounts' },
          { status: 403 }
        );
      }
    }

    // Update approval status and unsuspend if activating
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        approvalStatus,
        suspended: approvalStatus === 'ACTIVE' ? false : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        approvalStatus: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user approval:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
