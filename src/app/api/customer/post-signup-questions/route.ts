import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer by email
    // Note: These fields don't exist in the Customer model schema
    // If you need to store this data, consider adding them to the schema or using a separate table
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        // postcodeOutward, postcodeInward, yearOfBirth, rewardPreference, homeOwner, carOwner
        // are not fields in the Customer model - they need to be added to the schema if needed
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
    // Note: These fields don't exist in the Customer model schema
    // If you need to store this data, consider adding them to the schema or using a separate table
    // For now, we'll return a success message but not actually save the data
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add these fields to the Customer model schema if needed:
    // postcodeOutward, postcodeInward, yearOfBirth, rewardPreference, homeOwner, carOwner
    // Or create a separate CustomerProfile table to store this information

    return NextResponse.json({
      message: 'Post-signup questions feature not yet implemented - fields need to be added to schema',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        // Fields below are not available in current schema
        // postcodeOutward, postcodeInward, yearOfBirth, rewardPreference, homeOwner, carOwner
      },
    });
  } catch (error) {
    console.error('Error saving post-signup questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
