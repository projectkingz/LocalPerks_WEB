/**
 * Diagnostic endpoint to test mobile login flow
 * GET /api/test-mobile-login?email=test@example.com
 * This helps diagnose login issues without actually logging in
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email') || 'test@example.com';

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    email: email,
    checks: {
      prismaClient: {
        status: 'unknown',
        message: '',
        error: null as any,
      },
      accelerate: {
        endpointSet: !!process.env.PRISMA_ACCELERATE_ENDPOINT,
        endpointPreview: process.env.PRISMA_ACCELERATE_ENDPOINT 
          ? process.env.PRISMA_ACCELERATE_ENDPOINT.substring(0, 50) + '...'
          : 'Not set',
        protocol: process.env.PRISMA_ACCELERATE_ENDPOINT?.startsWith('prisma+mysql://') 
          ? 'prisma+mysql:// (Correct)'
          : process.env.PRISMA_ACCELERATE_ENDPOINT?.startsWith('prisma://')
          ? 'prisma:// (Missing +mysql)'
          : 'N/A',
      },
      databaseUrl: {
        urlSet: !!process.env.DATABASE_URL,
        urlPreview: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...'
          : 'Not set',
      },
      nextAuthSecret: {
        secretSet: !!process.env.NEXTAUTH_SECRET,
        isFallback: process.env.NEXTAUTH_SECRET === 'fallback-secret',
        preview: process.env.NEXTAUTH_SECRET 
          ? process.env.NEXTAUTH_SECRET.substring(0, 10) + '...'
          : 'Not set',
      },
      userLookup: {
        status: 'pending',
        message: '',
        userFound: false,
        userData: null as any,
        error: null as any,
      },
    },
  };

  try {
    // Test 1: Check if Prisma Client can be accessed
    diagnostics.checks.prismaClient.status = 'checking';
    diagnostics.checks.prismaClient.message = 'Prisma Client accessible';
    
    // Test 2: Try to query the database
    diagnostics.checks.userLookup.status = 'checking';
    diagnostics.checks.userLookup.message = `Looking up user: ${email}`;
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        suspended: true,
        approvalStatus: true,
        password: false, // Don't include password
      }
    });

    if (user) {
      diagnostics.checks.userLookup.status = 'success';
      diagnostics.checks.userLookup.message = 'User found in database';
      diagnostics.checks.userLookup.userFound = true;
      diagnostics.checks.userLookup.userData = user;
    } else {
      diagnostics.checks.userLookup.status = 'not_found';
      diagnostics.checks.userLookup.message = 'User not found in database';
      diagnostics.checks.userLookup.userFound = false;
    }

    diagnostics.checks.prismaClient.status = 'success';
    diagnostics.checks.prismaClient.message = 'Prisma Client working correctly';

  } catch (error: any) {
    diagnostics.checks.prismaClient.status = 'failed';
    diagnostics.checks.prismaClient.message = 'Prisma Client error';
    diagnostics.checks.prismaClient.error = {
      name: error?.name || 'UnknownError',
      message: error?.message || 'Unknown error',
      code: error?.code,
    };

    diagnostics.checks.userLookup.status = 'failed';
    diagnostics.checks.userLookup.message = 'Database query failed';
    diagnostics.checks.userLookup.error = {
      name: error?.name || 'UnknownError',
      message: error?.message || 'Unknown error',
      code: error?.code,
    };

    // Check if it's the Query Engine error
    if (error?.message?.includes('Query Engine') || error?.message?.includes('rhel-openssl')) {
      diagnostics.checks.prismaClient.error.diagnosis = 'Prisma Query Engine error - PRISMA_ACCELERATE_ENDPOINT likely not set or incorrect';
      diagnostics.checks.userLookup.error.diagnosis = 'Prisma Query Engine error - PRISMA_ACCELERATE_ENDPOINT likely not set or incorrect';
    }
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

