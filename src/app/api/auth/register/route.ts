import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { generateUniqueDisplayId } from '@/lib/customerId';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER',
        emailVerified: new Date(),
      },
    });

    // Create customer record
    let defaultTenant = await prisma.tenant.findFirst({
      where: { name: 'System Default Tenant' }
    });

    if (!defaultTenant) {
      // Create a system user first for the tenant
      const systemUser = await prisma.user.create({
        data: {
          email: 'system@localperks.com',
          name: 'LocalPerks System',
          role: 'ADMIN',
          suspended: false,
        }
      });

      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'System Default Tenant',
          partnerUserId: systemUser.id,
        }
      });
    }

    // Generate unique display ID (uses shared client with Accelerate)
    const displayId = await generateUniqueDisplayId();
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        mobile: phone || '',
        tenantId: defaultTenant.id,
        displayId: displayId,
      },
    });

    return NextResponse.json({ 
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}