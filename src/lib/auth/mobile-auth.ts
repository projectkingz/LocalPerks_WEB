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
      console.log('Mobile auth: No Authorization header or not Bearer token');
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Mobile auth: No token found in Authorization header');
      return null;
    }
    
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    if (!secret || secret === 'fallback-secret') {
      console.error('Mobile auth: NEXTAUTH_SECRET not configured');
    }
    
    const decoded = verify(token, secret) as any;
    
    if (!decoded || !decoded.userId) {
      console.log('Mobile auth: Token decoded but missing userId', decoded);
      return null;
    }
    
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

    if (!user) {
      console.log('Mobile auth: User not found for userId:', decoded.userId);
      return null;
    }

    if (user.suspended) {
      console.log('Mobile auth: User is suspended:', decoded.userId);
      return null;
    }

    // Check approval status for partners
    if (user.role === 'PARTNER' && user.approvalStatus !== 'APPROVED' && user.approvalStatus !== 'ACTIVE') {
      console.log('Mobile auth: Partner not approved, status:', user.approvalStatus);
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
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.name);
    }
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

