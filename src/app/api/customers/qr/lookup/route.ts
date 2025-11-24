import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customers/qr/lookup?qrCode={qrCode}
 * Looks up a customer by their QR code
 * Used when scanning QR codes to identify the customer
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode');

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find customer by QR code
    const customer = await prisma.customer.findUnique({
      where: { qrCode },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        points: true,
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
        { error: 'Customer not found for this QR code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        mobile: customer.mobile,
        points: customer.points,
        tenantId: customer.tenantId,
        tenant: customer.tenant
      }
    });
  } catch (error) {
    console.error('Error looking up customer by QR code:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers/qr/lookup
 * Alternative endpoint that accepts QR code in request body
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find customer by QR code
    const customer = await prisma.customer.findUnique({
      where: { qrCode },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        points: true,
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
        { error: 'Customer not found for this QR code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        mobile: customer.mobile,
        points: customer.points,
        tenantId: customer.tenantId,
        tenant: customer.tenant
      }
    });
  } catch (error) {
    console.error('Error looking up customer by QR code:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}













