import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { getTenantPointsConfig } from '@/lib/pointsCalculation';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/points/config
 * Fetch points configuration for the authenticated user's tenant
 * Works for both web sessions and mobile JWT tokens
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email as string | undefined;
  let userRole = session?.user?.role as string | undefined;
  let userTenantId = (session?.user as any)?.tenantId as string | undefined;

  // Check for mobile JWT token if no session
  if (!userEmail) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const payload = verifyMobileJwt(token);
    if (payload) {
      userEmail = payload.email;
      userRole = (payload as any).role;
      userTenantId = payload.tenantId || undefined;
    }
  }

  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // If user doesn't have a tenantId, try to find it
    if (!userTenantId) {
      if (userRole === 'PARTNER') {
        // For partners, find their tenant
        const tenant = await prisma.tenant.findFirst({
          where: { partnerUserId: (session?.user as any)?.id },
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

