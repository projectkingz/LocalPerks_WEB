import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  try {
    const count = await prisma.message.count({
      where: {
        recipientId: session.user.id,
        readAt: null,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

