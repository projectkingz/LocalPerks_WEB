import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export interface MobileAuthUser {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

export async function authenticateMobileToken(request: NextRequest): Promise<MobileAuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
    
    // Verify user still exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        suspended: true,
        approvalStatus: true,
      }
    });

    if (!user || user.suspended) {
      return null;
    }

    // Check approval status for partners
    if (user.role === 'PARTNER' && user.approvalStatus !== 'APPROVED') {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };
  } catch (error) {
    console.error('Mobile token verification failed:', error);
    return null;
  }
}

export function createMobileSession(mobileUser: MobileAuthUser) {
  return {
    user: {
      id: mobileUser.userId,
      email: mobileUser.email,
      role: mobileUser.role,
      tenantId: mobileUser.tenantId,
    }
  };
}

