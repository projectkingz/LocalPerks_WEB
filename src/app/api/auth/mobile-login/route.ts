import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    console.log('Mobile login: Starting request processing');
    console.log('Mobile login: Environment check');
    console.log('Mobile login:   PRISMA_ACCELERATE_ENDPOINT exists:', !!process.env.PRISMA_ACCELERATE_ENDPOINT);
    console.log('Mobile login:   DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('Mobile login:   NODE_ENV:', process.env.NODE_ENV);
    
    // CRITICAL: Ensure Prisma Client is initialized before use
    // This forces the client to be created with Accelerate if available
    try {
      console.log('Mobile login: Ensuring Prisma Client is initialized...');
      // Access a property to trigger initialization
      if (prisma && typeof prisma === 'object') {
        console.log('Mobile login: Prisma Client object exists');
        // Try to access $connect to ensure client is ready
        if ('$connect' in prisma && typeof prisma.$connect === 'function') {
          console.log('Mobile login: Prisma Client has $connect method');
        }
      }
    } catch (initError: any) {
      console.error('Mobile login: Prisma Client initialization check failed:', initError.message);
      // Don't throw here - let the actual query fail with a better error
    }
    
    const body = await request.json();
    console.log('Mobile login: Request body parsed');
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Mobile login attempt for:', email);

    // Find user with password
    console.log('Mobile login: Querying database for user');
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
    console.log('Mobile login: Starting password comparison');
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
    let userData: any = { ...user };
    
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
    console.log('Mobile login: Creating JWT token');
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    if (!secret || secret === 'fallback-secret') {
      console.error('Mobile login: WARNING - NEXTAUTH_SECRET not configured, using fallback');
    }
    const sessionToken = sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId,
      },
      secret,
      { expiresIn: '7d' }
    );
    console.log('Mobile login: JWT token created successfully');

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
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Prisma Query Engine error
      if (error.message.includes('Query Engine') || error.message.includes('rhel-openssl')) {
        console.error('❌ PRISMA QUERY ENGINE ERROR DETECTED!');
        console.error('❌ This means PRISMA_ACCELERATE_ENDPOINT is not set or not working correctly');
        console.error('❌ Please check Vercel environment variables');
        console.error('❌ Expected format: prisma+mysql://accelerate.prisma-data.net/?api_key=...');
        
        return NextResponse.json(
          { 
            error: 'Database connection error',
            details: {
              name: error.name,
              message: 'Prisma Query Engine error - PRISMA_ACCELERATE_ENDPOINT may not be configured correctly in Vercel',
              diagnosis: 'Please verify PRISMA_ACCELERATE_ENDPOINT is set in Vercel environment variables',
              checkEndpoint: 'Visit /api/test-accelerate to verify Accelerate configuration',
            }
          },
          { status: 500 }
        );
      }
    }
    
    // Always return detailed error for debugging (we can restrict this later)
    const errorDetails = error instanceof Error 
      ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      : { message: 'Unknown error' };
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorDetails
      },
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

// Handle GET request - return method not allowed with helpful message
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Method Not Allowed',
      message: 'This endpoint only accepts POST requests. Use POST to login.',
      allowedMethods: ['POST', 'OPTIONS']
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
}

function calculateTier(points: number): string {
  if (points >= 1000) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Standard";
}