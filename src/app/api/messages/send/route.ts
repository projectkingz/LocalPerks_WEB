import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { Buffer } from 'buffer';

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

function canSendMessage(senderRole?: Role | null, recipientRole?: Role | null) {
  if (!senderRole || !recipientRole) return false;

  const senderIsAdmin = isAdminRole(senderRole);
  const recipientIsAdmin = isAdminRole(recipientRole);

  const senderIsCustomer = isCustomerRole(senderRole);
  const recipientIsCustomer = isCustomerRole(recipientRole);

  const senderIsPartner = isPartnerRole(senderRole);
  const recipientIsPartner = isPartnerRole(recipientRole);

  // Disallow customer-partner and partner-customer for now
  if (
    (senderIsCustomer && recipientIsPartner) ||
    (senderIsPartner && recipientIsCustomer)
  ) {
    return false;
  }

  // Allow admin <-> customer and admin <-> partner
  if (
    (senderIsAdmin && (recipientIsCustomer || recipientIsPartner)) ||
    (recipientIsAdmin && (senderIsCustomer || senderIsPartner))
  ) {
    return true;
  }

  // For now, block all other combinations (user-user messaging)
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const senderId = session.user.id;
  const senderRole = session.user.role as Role | undefined;

  const contentType = request.headers.get('content-type') || '';
  let recipientId: string | undefined;
  let content: string | undefined;
  let attachmentUrl: string | undefined;
  let attachmentName: string | undefined;
  let attachmentMimeType: string | undefined;
  let attachmentSize: number | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    recipientId = formData.get('recipientId') as string | undefined;
    content = (formData.get('content') as string | null) || undefined;

    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      // Limit to ~2MB to avoid huge payloads
      const maxSizeBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          { error: 'Attachment too large (max 2MB)' },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      attachmentUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
      attachmentName = file.name || 'attachment';
      attachmentMimeType = file.type || 'application/octet-stream';
      attachmentSize = file.size;
    }
  } else {
    const body = await request.json().catch(() => ({}));
    const parsed = body as { recipientId?: string; content?: string };
    recipientId = parsed.recipientId;
    content = parsed.content;
  }

  const hasAttachment = !!attachmentUrl;
  if ((!content || typeof content !== 'string' || !content.trim()) && !hasAttachment) {
    return NextResponse.json(
      { error: 'Message content or attachment is required' },
      { status: 400 },
    );
  }

  content = (content || '').trim();

  try {
    let finalRecipientId = recipientId;

    if (!isAdminRole(senderRole)) {
      // Non-admin senders always message the default admin
      const adminUser = await findDefaultAdmin();
      if (!adminUser) {
        return NextResponse.json(
          { error: 'No admin account available to receive messages' },
          { status: 500 },
        );
      }
      finalRecipientId = adminUser.id;
    }

    if (!finalRecipientId) {
      return NextResponse.json(
        { error: 'recipientId is required when sending as admin' },
        { status: 400 },
      );
    }

    if (finalRecipientId === senderId) {
      return NextResponse.json(
        { error: 'You cannot send messages to yourself' },
        { status: 400 },
      );
    }

    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId }, select: { id: true, role: true } }),
      prisma.user.findUnique({ where: { id: finalRecipientId }, select: { id: true, role: true } }),
    ]);

    if (!sender) {
      return NextResponse.json({ error: 'Sender account not found' }, { status: 404 });
    }
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    if (!canSendMessage(sender.role as Role, recipient.role as Role)) {
      return NextResponse.json(
        { error: 'Messaging between these user roles is not allowed' },
        { status: 403 },
      );
    }

    // Use a transaction to atomically re-verify both users still exist at write time.
    // The Message model has no DB-level FK constraints, so without this check a
    // deleted user between the lookup above and the create below would create an
    // orphaned record.
    const message = await prisma.$transaction(async (tx) => {
      const [senderCheck, recipientCheck] = await Promise.all([
        tx.user.findUnique({ where: { id: senderId }, select: { id: true } }),
        tx.user.findUnique({ where: { id: finalRecipientId }, select: { id: true } }),
      ]);
      if (!senderCheck || !recipientCheck) {
        throw Object.assign(new Error('User deleted during message send'), { code: 'USER_DELETED' });
      }
      return tx.message.create({
        data: {
          senderId,
          recipientId: finalRecipientId,
          content,
          attachmentUrl,
          attachmentName,
          attachmentMimeType,
          attachmentSize,
        },
      });
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'USER_DELETED') {
      return NextResponse.json({ error: 'Recipient no longer exists' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    );
  }
}

