import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Fetch admin profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminProfile: {
          select: {
            id: true,
            name: true,
            mobile: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = {
      name: user.adminProfile?.name || user.name,
      email: user.email,
      mobile: user.adminProfile?.mobile || '',
      role: user.role,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update admin profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, mobile } = await req.json();

    // Check if admin profile exists
    const existingProfile = await prisma.admin.findUnique({
      where: { adminUserId: session.user.id },
    });

    if (existingProfile) {
      // Update existing profile
      await prisma.admin.update({
        where: { adminUserId: session.user.id },
        data: {
          name: name || existingProfile.name,
          mobile: mobile || null,
        },
      });
    } else {
      // Create new profile if it doesn't exist
      await prisma.admin.create({
        data: {
          name: name || session.user.name || 'Admin',
          mobile: mobile || null,
          adminUserId: session.user.id,
        },
      });
    }

    // Also update the user name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

