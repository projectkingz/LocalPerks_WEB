import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

    // Generate a unique QR code value for the user
    // In a real app, you might want to store this in your database
    const qrValue = `rewards-${email}-${uuidv4()}`;

    return NextResponse.json({ qrCode: qrValue });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
} 