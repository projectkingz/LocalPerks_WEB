import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function requireSuperAdmin(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== 'SUPER_ADMIN') {
      return null;
    }
    return token;
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      message: 'Subscription tracking is now handled offline. No subscription data is exposed through this API.',
    },
    { status: 410 }
  );
}
