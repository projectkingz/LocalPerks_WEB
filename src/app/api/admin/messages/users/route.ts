import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER' | 'CUSTOMER' | string;

function isAdminRole(role?: Role | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role as Role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);
    if (!adminIds.length) {
      return NextResponse.json({ users: [] });
    }

    const grouped = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        recipientId: { in: adminIds },
      },
      _max: {
        createdAt: true,
      },
    });

    const unreadGrouped = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        recipientId: { in: adminIds },
        readAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const unreadMap = new Map<string, number>();
    unreadGrouped.forEach((g) => {
      unreadMap.set(g.senderId, g._count._all ?? 0);
    });

    const senderIds = grouped.map((g) => g.senderId);

    if (!senderIds.length) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const usersById = new Map(users.map((u) => [u.id, u]));

    const result = grouped
      .map((g) => {
        const user = usersById.get(g.senderId);
        if (!user) return null;
        return {
          user,
          unreadCount: unreadMap.get(g.senderId) ?? 0,
          lastMessageAt: g._max.createdAt,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (!a.lastMessageAt || !b.lastMessageAt) return 0;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

    return NextResponse.json({ users: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load message users' },
      { status: 500 },
    );
  }
}

