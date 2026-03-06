import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER' | 'CUSTOMER' | string;

function isAdminRole(role?: Role | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function isCustomerRole(role?: Role | null) {
  return role === 'CUSTOMER';
}

function isPartnerRole(role?: Role | null) {
  return role === 'PARTNER';
}

function canViewThread(currentRole?: Role | null, otherRole?: Role | null) {
  if (!currentRole || !otherRole) return false;

  const currentIsAdmin = isAdminRole(currentRole);
  const otherIsAdmin = isAdminRole(otherRole);
  const currentIsCustomer = isCustomerRole(currentRole);
  const otherIsCustomer = isCustomerRole(otherRole);
  const currentIsPartner = isPartnerRole(currentRole);
  const otherIsPartner = isPartnerRole(otherRole);

  // Disallow customer-partner and partner-customer for now
  if (
    (currentIsCustomer && otherIsPartner) ||
    (currentIsPartner && otherIsCustomer)
  ) {
    return false;
  }

  // Allow admin <-> customer and admin <-> partner
  if (
    (currentIsAdmin && (otherIsCustomer || otherIsPartner)) ||
    (otherIsAdmin && (currentIsCustomer || currentIsPartner))
  ) {
    return true;
  }

  // For now, block all other combinations
  return false;
}

async function findDefaultAdmin() {
  return prisma.user.findFirst({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const otherUserId = url.searchParams.get('otherUserId');

  const currentUserId = session.user.id;
  const currentRole = session.user.role as Role | undefined;

  try {
    let finalOtherUserId = otherUserId;

    if (!isAdminRole(currentRole)) {
      // Non-admin users always see their thread with the default admin
      const adminUser = await findDefaultAdmin();
      if (!adminUser) {
        return NextResponse.json(
          { error: 'No admin account available to receive messages' },
          { status: 500 },
        );
      }
      finalOtherUserId = adminUser.id;
    }

    if (!finalOtherUserId) {
      return NextResponse.json(
        { error: 'otherUserId is required when viewing threads as admin' },
        { status: 400 },
      );
    }

    if (finalOtherUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot open a thread with yourself' },
        { status: 400 },
      );
    }

    const [currentUser, otherUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId } }),
      prisma.user.findUnique({ where: { id: finalOtherUserId } }),
    ]);

    if (!currentUser || !otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    if (!canViewThread(currentUser.role as Role, otherUser.role as Role)) {
      return NextResponse.json(
        { error: 'Messaging between these user roles is not allowed' },
        { status: 403 },
      );
    }

    // Fetch all admin users so that conversations are shared across admins
    // and we can annotate admin messages with sender details.
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const adminIds = admins.map((a) => a.id);

    const currentIsAdmin = isAdminRole(currentUser.role as Role);

    let messages;

    if (currentIsAdmin) {
      // Admin viewing a thread with a customer/partner:
      // show ALL messages between that user and ANY admin.
      [messages] = await Promise.all([
        prisma.message.findMany({
          where: {
            OR: [
              {
                senderId: otherUser.id,
                recipientId: { in: adminIds },
              },
              {
                senderId: { in: adminIds },
                recipientId: otherUser.id,
              },
            ],
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
        prisma.message.updateMany({
          where: {
            senderId: otherUser.id,
            recipientId: { in: adminIds },
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        }),
      ]);
    } else {
      // Customer/partner viewing their thread with admin:
      // show ALL messages between this user and ANY admin.
      [messages] = await Promise.all([
        prisma.message.findMany({
          where: {
            OR: [
              {
                senderId: currentUser.id,
                recipientId: { in: adminIds },
              },
              {
                senderId: { in: adminIds },
                recipientId: currentUser.id,
              },
            ],
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
        prisma.message.updateMany({
          where: {
            senderId: { in: adminIds },
            recipientId: currentUser.id,
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        }),
      ]);
    }

    return NextResponse.json({
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role,
      },
      messages,
      adminSenders: admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 },
    );
  }
}

