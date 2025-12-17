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
    const isSecretConfigured = secret && secret !== 'fallback-secret';
    
    console.log('Mobile auth: Attempting token verification');
    console.log('Mobile auth: Secret configured:', isSecretConfigured);
    console.log('Mobile auth: Token preview:', token.substring(0, 20) + '...');
    
    let decoded: any;
    try {
      decoded = verify(token, secret) as any;
      console.log('Mobile auth: Token verified successfully');
      console.log('Mobile auth: Decoded payload:', { 
        userId: decoded?.userId, 
        email: decoded?.email, 
        role: decoded?.role,
        hasUserId: !!decoded?.userId 
      });
    } catch (jwtError: any) {
      console.error('Mobile auth: JWT verification failed');
      console.error('Mobile auth: Error name:', jwtError?.name);
      console.error('Mobile auth: Error message:', jwtError?.message);
      if (jwtError?.name === 'TokenExpiredError') {
        console.error('Mobile auth: Token has expired');
      } else if (jwtError?.name === 'JsonWebTokenError') {
        console.error('Mobile auth: Invalid token format or signature');
      } else if (jwtError?.name === 'NotBeforeError') {
        console.error('Mobile auth: Token not active yet');
      }
      return null;
    }
    
    if (!decoded || !decoded.userId) {
      console.log('Mobile auth: Token decoded but missing userId', decoded);
      return null;
    }
    
    console.log('Mobile auth: Looking up user with userId:', decoded.userId);
    
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

    console.log('Mobile auth: User found:', { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      suspended: user.suspended,
      approvalStatus: user.approvalStatus 
    });

    if (user.suspended) {
      console.log('Mobile auth: User is suspended:', decoded.userId);
      return null;
    }

    // Check approval status for partners
    if (user.role === 'PARTNER' && user.approvalStatus !== 'APPROVED' && user.approvalStatus !== 'ACTIVE') {
      console.log('Mobile auth: Partner not approved, status:', user.approvalStatus);
      return null;
    }

    console.log('Mobile auth: Authentication successful for:', user.email);
    
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };
  } catch (error) {
    console.error('Mobile token verification failed with unexpected error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.name, error.stack);
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

