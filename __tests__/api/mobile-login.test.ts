/**
 * Tests for /api/auth/mobile-login endpoint
 * Used by React Native app for user authentication
 */

import { POST, OPTIONS } from '@/app/api/auth/mobile-login/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  },
}));

const mockCompare = jest.fn();
const mockHash = jest.fn();
jest.mock('bcryptjs', () => ({
  compare: (...args: any[]) => mockCompare(...args),
  hash: (...args: any[]) => mockHash(...args),
}));

const mockSign = jest.fn(() => 'mock-jwt-token');
jest.mock('jsonwebtoken', () => ({
  sign: (...args: any[]) => mockSign(...args),
}));

describe('/api/auth/mobile-login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set required environment variables
    process.env.NEXTAUTH_SECRET = 'test-secret-key';
    // Reset the mock sign function
    mockSign.mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('OPTIONS', () => {
    it('should return CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'OPTIONS',
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });

  describe('POST', () => {
    it('should return 400 if email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 401 if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        select: expect.objectContaining({
          id: true,
          email: true,
          password: true,
        }),
      });
    });

    it('should return 401 if user has no password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const hashedPassword = 'hashed-password-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'CUSTOMER',
        tenantId: null,
        suspended: false,
        approvalStatus: 'ACTIVE',
      });

      mockCompare.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', hashedPassword);
    });

    it('should return 403 if user is suspended', async () => {
      const hashedPassword = 'hashed-password-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'CUSTOMER',
        tenantId: null,
        suspended: true,
        approvalStatus: 'ACTIVE',
      });

      mockCompare.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account suspended');
    });

    it('should return 403 if partner is not approved', async () => {
      const hashedPassword = 'hashed-password-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'partner@example.com',
        name: 'Test Partner',
        password: hashedPassword,
        role: 'PARTNER',
        tenantId: 'tenant-1',
        suspended: false,
        approvalStatus: 'PENDING',
      });

      mockCompare.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'partner@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Partner account pending approval');
    });

    it('should successfully login a customer and return session token', async () => {
      const hashedPassword = 'hashed-password-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'customer@example.com',
        name: 'Test Customer',
        password: hashedPassword,
        role: 'CUSTOMER',
        tenantId: null,
        suspended: false,
        approvalStatus: 'ACTIVE',
      });

      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        points: 500,
        tenantId: 'tenant-1',
      });

      mockCompare.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'customer@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionToken).toBe('mock-jwt-token');
      expect(data.user).toMatchObject({
        id: 'user-1',
        email: 'customer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        points: 500,
        tier: 'Gold',
        tenantId: 'tenant-1',
      });
      expect(data.user.password).toBeUndefined();
    });

    it('should successfully login a partner and return tenant data', async () => {
      const hashedPassword = 'hashed-password-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'partner@example.com',
        name: 'Test Partner',
        password: hashedPassword,
        role: 'PARTNER',
        tenantId: 'tenant-1',
        suspended: false,
        approvalStatus: 'APPROVED',
      });

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Business',
        mobile: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockCompare.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'partner@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionToken).toBe('mock-jwt-token');
      expect(data.user).toMatchObject({
        id: 'user-1',
        email: 'partner@example.com',
        name: 'Test Partner',
        role: 'PARTNER',
        tenantId: 'tenant-1',
      });
      expect(data.user.tenant).toMatchObject({
        id: 'tenant-1',
        name: 'Test Business',
        mobile: '+1234567890',
      });
      expect(data.user.password).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/mobile-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBeDefined();
      expect(data.details.message).toBe('Database connection failed');
    });
  });
});

