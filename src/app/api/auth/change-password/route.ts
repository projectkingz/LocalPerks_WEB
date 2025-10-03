import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { validatePassword } from '@/lib/utils/password';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or no password set' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet strength requirements',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing your password' },
      { status: 500 }
    );
  }
} 