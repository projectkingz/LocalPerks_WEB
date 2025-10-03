import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// DEV-ONLY: Reset ALL user passwords to a known value (password123)
// Usage: POST /api/dev/reset-all-passwords { secret }
// Requires env DEV_ADMIN_SECRET to match the provided secret
export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    const expected = process.env.DEV_ADMIN_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const hashed = await hash('password123', 10);

    const result = await prisma.user.updateMany({
      data: { password: hashed },
    });

    return NextResponse.json({ message: 'All user passwords reset to password123 (hashed)', updated: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}




