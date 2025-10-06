import * as jwt from 'jsonwebtoken';

export interface MobileJwtPayload {
  sub: string; // user id
  email: string;
  role?: string;
  tenantId?: string | null;
}

export function signMobileJwt(payload: MobileJwtPayload, expiresIn: string = '7d') {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret not configured');
  // @ts-ignore - Temporary fix for JWT type issues
  return jwt.sign(payload, secret, { expiresIn: expiresIn });
}

export function verifyMobileJwt(token?: string): MobileJwtPayload | null {
  try {
    if (!token) return null;
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as MobileJwtPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [type, token] = auth.split(' ');
  if (type?.toLowerCase() !== 'bearer') return null;
  return token || null;
}




