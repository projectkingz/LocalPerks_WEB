import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { 
      id: true,
      name: true, 
      mobile: true,
      partnerUser: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
  });
  
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  // Format the response with business and contact information
  const response = {
    businessName: tenant.name,
    contactName: tenant.partnerUser.name,
    email: tenant.partnerUser.email,
    mobile: tenant.mobile || '',
    // Legacy fields for backward compatibility
    name: tenant.name,
    phone: tenant.mobile || '',
  };
  
  return NextResponse.json(response);
}


