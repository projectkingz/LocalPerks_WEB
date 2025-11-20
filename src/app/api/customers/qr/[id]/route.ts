import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/customers/qr/[id]
 * Returns the persistent QR code for a customer by email
 * If no QR code exists, generates and stores one
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const email = params.id;
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find customer by email
    let customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, qrCode: true, email: true, name: true }
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
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      });
    }

    // Generate a unique QR code identifier
    let qrCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure QR code is unique
    while (!isUnique && attempts < maxAttempts) {
      const shortUuid = uuidv4().split('-')[0];
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
      customerId: customer.id,
      email: customer.email,
      name: customer.name
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
} 