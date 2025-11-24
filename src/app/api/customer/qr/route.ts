import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/customer/qr
 * Returns the persistent QR code for the authenticated customer
 * If no QR code exists, generates and stores one
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer by email
    let customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: { id: true, displayId: true, qrCode: true, email: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // If customer already has a QR code, return it
    if (customer.qrCode) {
      return NextResponse.json({ 
        qrCode: customer.qrCode,
        customerId: customer.displayId || customer.id // Use displayId if available, fallback to id
      });
    }

    // Generate a unique QR code identifier
    // Format: customer-{customerId}-{shortUuid}
    // This ensures uniqueness and makes it easy to identify the customer
    let qrCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure QR code is unique (handle edge case of collision)
    while (!isUnique && attempts < maxAttempts) {
      const shortUuid = uuidv4().split('-')[0]; // Use first part of UUID for shorter code
      qrCode = `customer-${customer.id}-${shortUuid}`;
      
      // Check if this QR code already exists
      const existing = await prisma.customer.findUnique({
        where: { qrCode }
      });
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique QR code' },
        { status: 500 }
      );
    }

    // Store the QR code in the database
    await prisma.customer.update({
      where: { id: customer.id },
      data: { qrCode }
    });

    return NextResponse.json({ 
      qrCode,
      customerId: customer.displayId || customer.id // Use displayId if available, fallback to id
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}











