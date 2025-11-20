import { NextResponse } from 'next/server';
import { verifyMobileJwt } from '@/lib/auth/mobile';
import { getTenantPointsConfig } from '@/lib/pointsCalculation';

/**
 * GET /api/tenants/[tenantId]/points-config/mobile
 * Fetch tenant-specific points configuration for mobile app
 */
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  // Verify mobile JWT token
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const payload = verifyMobileJwt(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = params;

    // Get tenant points configuration (will fall back to default if not set)
    const config = await getTenantPointsConfig(tenantId);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching points config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points configuration' },
      { status: 500 }
    );
  }
}







