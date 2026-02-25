import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer by email with post-signup question fields
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        postcodeOutward: true,
        postcodeInward: true,
        yearOfBirth: true,
        rewardPreference: true,
        homeOwner: true,
        carOwner: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching post-signup questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      postcodeOutward,
      postcodeInward,
      yearOfBirth,
      rewardPreference,
      homeOwner,
      carOwner,
    } = body;

    // Update customer with post-signup questions
    const customer = await prisma.customer.update({
      where: { email: session.user.email },
      data: {
        postcodeOutward: postcodeOutward || null,
        postcodeInward: postcodeInward || null,
        yearOfBirth: yearOfBirth || null,
        rewardPreference: rewardPreference || null,
        homeOwner: homeOwner !== undefined ? homeOwner : null,
        carOwner: carOwner !== undefined ? carOwner : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        postcodeOutward: true,
        postcodeInward: true,
        yearOfBirth: true,
        rewardPreference: true,
        homeOwner: true,
        carOwner: true,
      },
    });

    return NextResponse.json({
      message: 'Post-signup questions saved successfully',
      customer,
    });
  } catch (error) {
    console.error('Error saving post-signup questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
