import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    databaseUrl: !!process.env.DATABASE_URL,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: !!process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(envVars);
} 