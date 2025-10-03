import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Code and userId are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual 2FA verification logic
    // For now, return a mock response
    return NextResponse.json({ 
      success: true, 
      message: '2FA verification successful' 
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
} 