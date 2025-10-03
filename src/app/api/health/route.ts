import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'LocalPerks Backend is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      customers: '/api/customers',
      transactions: '/api/transactions',
      rewards: '/api/rewards'
    }
  });
}


