import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const customer = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, mobile: true },
  });
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
  return NextResponse.json(customer);
} 