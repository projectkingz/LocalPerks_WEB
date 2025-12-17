import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { authenticateMobileToken, createMobileSession } from '@/lib/auth/mobile-auth';
import { getTenantPointsConfig } from '@/lib/pointsCalculation';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/points/config
 * Fetch points configuration for the authenticated user's tenant
 * Works for both web sessions and mobile JWT tokens
 */
export async function GET(request: NextRequest) {
  console.log('GET /api/points/config called');
  try {
    // Try mobile authentication first
    console.log('Points config: Attempting mobile authentication...');
    const mobileUser = await authenticateMobileToken(request);
    let session;
    
    if (mobileUser) {
      console.log('Points config: Mobile authentication successful for:', mobileUser.email);
      session = createMobileSession(mobileUser);
    } else {
      console.log('Points config: Mobile authentication failed, falling back to NextAuth session...');
      // Fall back to NextAuth session
      session = await getServerSession(authOptions);
      if (session) {
        console.log('Points config: NextAuth session found for:', session.user?.email);
      } else {
        console.log('Points config: No NextAuth session found either');
      }
    }

    if (!session?.user?.email) {
      console.log('Points config: No valid session found');
      // Return more detailed error for debugging
      const authHeader = request.headers.get('Authorization');
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader?.substring(0, 10),
          hasSession: !!session,
          sessionUser: session?.user ? 'exists' : 'missing'
        }
      }, { status: 401 });
    }
    
    console.log('Points config: Authenticated user:', session.user.email, 'Role:', session.user.role);

    const userEmail = session.user.email;
    const userRole = session.user.role;
    let userTenantId = (session.user as any)?.tenantId;

    // If user doesn't have a tenantId, try to find it
    if (!userTenantId) {
      if (userRole === 'PARTNER') {
        // For partners, find their tenant
        const tenant = await prisma.tenant.findFirst({
          where: { partnerUserId: session.user.id || (session.user as any)?.id },
        });
        userTenantId = tenant?.id;
      } else if (userRole === 'CUSTOMER') {
        // For customers, find their customer record
        const customer = await prisma.customer.findUnique({
          where: { email: userEmail },
        });
        userTenantId = customer?.tenantId;
      }
    }

    if (!userTenantId) {
      // Return default configuration if no tenant found
      const { defaultPointsConfig } = await import('@/lib/pointsConfig');
      return NextResponse.json({
        success: true,
        config: defaultPointsConfig,
        usingDefault: true,
      });
    }

    // Get tenant points configuration
    const config = await getTenantPointsConfig(userTenantId);

    return NextResponse.json({
      success: true,
      config,
      tenantId: userTenantId,
    });
  } catch (error) {
    console.error('Error fetching points config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points configuration' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}




