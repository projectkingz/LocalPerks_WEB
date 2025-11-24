import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Fetch customer profile
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a customer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'This endpoint is only for customer accounts' },
        { status: 403 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        displayId: true,
        name: true,
        email: true,
        mobile: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Return combined profile data
    return NextResponse.json({
      id: user.id,
      customerId: customer.displayId || customer.id, // Use displayId if available, fallback to id
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      points: customer.points,
      tier: user.tier,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });

  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update customer profile
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, mobile } = await req.json();

    if (!name && !mobile) {
      return NextResponse.json(
        { error: 'At least one field (name or mobile) is required' },
        { status: 400 }
      );
    }

    // Verify user is a customer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'This endpoint is only for customer accounts' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;

    // Update customer profile
    const updatedCustomer = await prisma.customer.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Also update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      customer: updatedCustomer,
    });

  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







