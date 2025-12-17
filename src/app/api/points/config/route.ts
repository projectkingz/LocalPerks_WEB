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
  try {
    // Try mobile authentication first
    const mobileUser = await authenticateMobileToken(request);
    let session;
    
    if (mobileUser) {
      session = createMobileSession(mobileUser);
    } else {
      // Fall back to NextAuth session
      session = await getServerSession(authOptions);
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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







