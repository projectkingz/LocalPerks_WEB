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

    // Get the target user with current status
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, email: true, approvalStatus: true, emailVerified: true },
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

    // For partners stuck in verification states, handle them appropriately
    let updateData: any = {
      approvalStatus,
      suspended: approvalStatus === 'ACTIVE' ? false : true
    };

    // If partner is stuck at email verification and we're approving them, mark email as verified
    if (targetUser.role === 'PARTNER' && 
        targetUser.approvalStatus === 'PENDING_EMAIL_VERIFICATION' && 
        approvalStatus === 'ACTIVE') {
      updateData.emailVerified = new Date();
      console.log(`[Admin Approve] Partner ${targetUser.email} was stuck at email verification, marking email as verified`);
    }

    // If partner is stuck at mobile verification and we're approving them, skip to ACTIVE
    if (targetUser.role === 'PARTNER' && 
        targetUser.approvalStatus === 'PENDING_MOBILE_VERIFICATION' && 
        approvalStatus === 'ACTIVE') {
      console.log(`[Admin Approve] Partner ${targetUser.email} was stuck at mobile verification, approving directly`);
    }

    // If partner is at PENDING_ADMIN_APPROVAL and we're approving them, activate
    if (targetUser.role === 'PARTNER' && 
        targetUser.approvalStatus === 'PENDING_ADMIN_APPROVAL' && 
        approvalStatus === 'ACTIVE') {
      console.log(`[Admin Approve] Partner ${targetUser.email} approved from PENDING_ADMIN_APPROVAL to ACTIVE`);
    }

    // Update approval status and unsuspend if activating
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
