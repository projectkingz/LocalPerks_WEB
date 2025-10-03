import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// DEV-ONLY: Set or reset a user's password by email
// Usage: POST /api/dev/set-password { email, password, secret }
// Gate with DEV_ADMIN_SECRET in env
export async function POST(req: NextRequest) {
  try {
    const { email, password, secret } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const expected = process.env.DEV_ADMIN_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    const passwordHash = await hash(password, 10);
    await prisma.user.update({ where: { email }, data: { password: passwordHash } });

    return NextResponse.json({ message: 'Password updated', email });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}




