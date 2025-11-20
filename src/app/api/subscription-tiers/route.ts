import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch active subscription tiers (public endpoint)
    const subscriptionTiers = await prisma.subscriptionTier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    return NextResponse.json({
      subscriptionTiers,
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers' },
      { status: 500 }
    );
  }
}




