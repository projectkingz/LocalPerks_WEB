import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Mobile login attempt for:', email);

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        password: true,
        suspended: true,
        approvalStatus: true,
      }
    });

    console.log('User found:', user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      suspended: user.suspended,
      approvalStatus: user.approvalStatus,
      hasPassword: !!user.password
    } : 'No user found');

    if (!user || !user.password) {
      console.log('User not found or no password set');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    console.log('Comparing password:', password, 'with stored hash:', user.password.substring(0, 20) + '...');
    const isValidPassword = await compare(password, user.password);
    console.log('Password comparison result:', isValidPassword);
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is suspended
    if (user.suspended) {
      console.log('User is suspended');
      return NextResponse.json(
        { error: 'Account suspended' },
        { status: 403 }
      );
    }

    // Check approval status for partners
    if (user.role === 'PARTNER' && user.approvalStatus && user.approvalStatus !== 'ACTIVE' && user.approvalStatus !== 'APPROVED') {
      console.log('Partner not approved, status:', user.approvalStatus);
      return NextResponse.json(
        { error: 'Partner account pending approval' },
        { status: 403 }
      );
    }

    // Get customer/tenant data based on role
    let userData = { ...user };
    
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { email: user.email },
        select: {
          points: true,
          tenantId: true,
        }
      });
      
      if (customer) {
        // Calculate tier based on points
        const tier = calculateTier(customer.points);
        
        userData = {
          ...userData,
          points: customer.points,
          tier: tier,
          tenantId: customer.tenantId,
        };
      }
    } else if (user.role === 'PARTNER' && user.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          mobile: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (tenant) {
        userData = {
          ...userData,
          tenant: tenant,
        };
      }
    }

    // Create session token
    const sessionToken = sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = userData;

    console.log('Mobile login successful for:', email);

    return NextResponse.json({
      success: true,
      sessionToken,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function calculateTier(points: number): string {
  if (points >= 1000) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Standard";
}