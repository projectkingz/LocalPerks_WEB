import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile, password, role } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Invalid role. Must be ADMIN or SUPER_ADMIN' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user and admin profile in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user (suspended, pending approval)
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          suspended: true, // Account suspended until superadmin approval
          approvalStatus: 'UNDER_REVIEW',
          emailVerified: new Date(),
        },
      });

      // Create admin profile
      const adminProfile = await tx.admin.create({
        data: {
          name,
          mobile: mobile || null,
          adminUserId: user.id,
        },
      });

      return { user, adminProfile };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully. Your account is under review and will be activated by a Super Administrator.',
        accountStatus: 'UNDER_REVIEW',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          approvalStatus: result.user.approvalStatus,
          suspended: result.user.suspended,
        },
        adminProfile: {
          id: result.adminProfile.id,
          name: result.adminProfile.name,
          mobile: result.adminProfile.mobile,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating admin account:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}

