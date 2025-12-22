import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accelerateEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;
    
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      accelerate: {
        endpointSet: !!accelerateEndpoint,
        endpointPreview: accelerateEndpoint 
          ? accelerateEndpoint.substring(0, 50) + '...' 
          : 'Not set',
        protocol: accelerateEndpoint 
          ? (accelerateEndpoint.startsWith('prisma+mysql://') 
              ? 'prisma+mysql:// (MySQL - Correct)' 
              : accelerateEndpoint.startsWith('prisma+postgres://')
              ? 'prisma+postgres:// (PostgreSQL - Wrong for MySQL DB)'
              : accelerateEndpoint.startsWith('prisma://')
              ? 'prisma:// (Missing database protocol - Wrong)'
              : 'Unknown protocol')
          : 'N/A',
        hasAccelerateDomain: accelerateEndpoint?.includes('accelerate.prisma-data.net') || false,
      },
      database: {
        urlSet: !!process.env.DATABASE_URL,
        urlPreview: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...'
          : 'Not set',
      },
      test: {
        status: 'pending',
        message: '',
        error: null as string | null,
      }
    };

    // Test 1: Check if Accelerate endpoint is configured correctly
    if (!accelerateEndpoint) {
      testResults.test.status = 'failed';
      testResults.test.message = 'PRISMA_ACCELERATE_ENDPOINT is not set';
      testResults.test.error = 'Environment variable missing';
      return NextResponse.json(testResults, { status: 200 });
    }

    if (!accelerateEndpoint.startsWith('prisma+mysql://')) {
      testResults.test.status = 'warning';
      if (accelerateEndpoint.startsWith('prisma://')) {
        testResults.test.message = 'Endpoint is missing database protocol (+mysql)';
        testResults.test.error = 'Should be: prisma+mysql://accelerate.prisma-data.net/...';
      } else if (accelerateEndpoint.startsWith('prisma+postgres://')) {
        testResults.test.message = 'Endpoint uses PostgreSQL protocol but database is MySQL';
        testResults.test.error = 'Should be: prisma+mysql://accelerate.prisma-data.net/...';
      } else {
        testResults.test.message = 'Endpoint protocol is incorrect';
        testResults.test.error = 'Should start with: prisma+mysql://';
      }
      return NextResponse.json(testResults, { status: 200 });
    }

    // Test 2: Try to make a simple database query
    try {
      console.log('[Test] Attempting database query with Accelerate...');
      const userCount = await prisma.user.count();
      
      testResults.test.status = 'success';
      testResults.test.message = `Database connection successful! Found ${userCount} users.`;
      
      // Check if we're actually using Accelerate (by checking if engine binary error would occur)
      // If this query works, Accelerate is likely working
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
        }
      });

      if (sampleUser) {
        testResults.test.message += ` Sample user: ${sampleUser.email} (${sampleUser.role})`;
      }

      return NextResponse.json(testResults, { status: 200 });
    } catch (dbError: any) {
      testResults.test.status = 'failed';
      testResults.test.message = 'Database query failed';
      testResults.test.error = dbError.message || 'Unknown database error';
      
      // Check if it's the engine binary error
      if (dbError.message?.includes('Query Engine') || dbError.message?.includes('rhel-openssl')) {
        testResults.test.error = 'Prisma is trying to use engine binary instead of Accelerate. Accelerate may not be configured correctly.';
      }
      
      return NextResponse.json(testResults, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

