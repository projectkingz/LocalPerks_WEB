import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/auth.config';
import { prisma } from '@/lib/prisma';

// Helper to check admin access
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }
  return session.user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  
  // Get the user being suspended
  const targetUser = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!targetUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Check permissions
  if (['ADMIN', 'SUPER_ADMIN'].includes(targetUser.role) && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  // Prevent self-suspension
  if (targetUser.id === admin.id) {
    return NextResponse.json({ message: 'Cannot suspend your own account' }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        suspended: data.suspended
      },
    });

    // Return user info except password
    const { password, ...userInfo } = updatedUser;
    return NextResponse.json(userInfo);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
} 