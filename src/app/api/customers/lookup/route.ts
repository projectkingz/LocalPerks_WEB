import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pointsUtil } from '@/lib/pointsUtil';

/**
 * GET /api/customers/lookup?displayId={displayId}
 * Looks up a customer by their 6-digit alphanumeric display ID
 * Used for manual transaction entry when QR code scanning fails
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const displayId = searchParams.get('displayId')?.toUpperCase().trim();

    if (!displayId) {
      return NextResponse.json(
        { error: 'Display ID is required' },
        { status: 400 }
      );
    }

    // Validate displayId format (6 alphanumeric characters)
    if (!/^[0-9A-Z]{6}$/.test(displayId)) {
      return NextResponse.json(
        { error: 'Display ID must be exactly 6 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Find customer by displayId (already normalized to uppercase)
    const customer = await prisma.customer.findUnique({
      where: {
        displayId: displayId
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        points: true,
        displayId: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found with this display ID' },
        { status: 404 }
      );
    }

    // Calculate actual points from transactions (not stored value)
    const calculatedPoints = await pointsUtil.calculateCustomerPoints(customer.id);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        mobile: customer.mobile,
        points: calculatedPoints, // Use calculated points instead of stored value
        displayId: customer.displayId,
        tenantId: customer.tenantId,
        tenant: customer.tenant
      }
    });
  } catch (error) {
    console.error('Error looking up customer by display ID:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers/lookup
 * Alternative endpoint that accepts displayId in request body
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const displayId = body.displayId?.toUpperCase().trim();

    if (!displayId) {
      return NextResponse.json(
        { error: 'Display ID is required' },
        { status: 400 }
      );
    }

    // Validate displayId format (6 alphanumeric characters)
    if (!/^[0-9A-Z]{6}$/.test(displayId)) {
      return NextResponse.json(
        { error: 'Display ID must be exactly 6 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Find customer by displayId (already normalized to uppercase)
    const customer = await prisma.customer.findUnique({
      where: {
        displayId: displayId
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        points: true,
        displayId: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found with this display ID' },
        { status: 404 }
      );
    }

    // Calculate actual points from transactions (not stored value)
    const calculatedPoints = await pointsUtil.calculateCustomerPoints(customer.id);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        mobile: customer.mobile,
        points: calculatedPoints, // Use calculated points instead of stored value
        displayId: customer.displayId,
        tenantId: customer.tenantId,
        tenant: customer.tenant
      }
    });
  } catch (error) {
    console.error('Error looking up customer by display ID:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}

