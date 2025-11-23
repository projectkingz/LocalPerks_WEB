import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/customers/qr
 * Validates a scanned QR code and returns customer information
 * Used by tenant scan page to identify customers
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find customer by QR code
    const customer = await prisma.customer.findUnique({
      where: { qrCode: code },
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
    console.error('Error validating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code' },
      { status: 500 }
    );
  }
}









