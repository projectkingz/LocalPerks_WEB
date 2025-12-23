/**
 * Tests for /api/points/mobile endpoint
 * Used by React Native app to fetch customer points
 */

import { GET, OPTIONS } from '@/app/api/points/mobile/route';
import { NextRequest } from 'next/server';
import { authenticateMobileToken } from '@/lib/auth/mobile-auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/auth/mobile-auth', () => ({
  authenticateMobileToken: jest.fn(),
  createMobileSession: jest.fn((user) => ({ user })),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  },
}));

describe('/api/points/mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('OPTIONS', () => {
    it('should return CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'OPTIONS',
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    });
  });

  describe('GET', () => {
    it('should return 401 if no authentication provided', async () => {
      (authenticateMobileToken as jest.Mock).mockResolvedValue(null);
      const { getServerSession } = require('next-auth');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if customer not found', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Customer not found');
    });

    it('should return points for customer with approved transactions', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'Test Customer',
        points: 500,
      });

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tx-1',
          type: 'EARNED',
          points: 100,
          status: 'APPROVED',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'EARNED',
          points: 200,
          status: 'APPROVED',
          createdAt: new Date(),
        },
        {
          id: 'tx-3',
          type: 'SPENT',
          points: -50,
          status: 'APPROVED',
          createdAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points).toBe(250); // 100 + 200 - 50
      expect(data.tier).toBe('Gold'); // 250 points = Gold tier
      expect(data.customerId).toBe('customer-1');
      expect(data.email).toBe('customer@example.com');
      expect(data.name).toBe('Test Customer');
    });

    it('should calculate points correctly including void transactions', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'Test Customer',
      });

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tx-1',
          type: 'EARNED',
          points: 100,
          status: 'APPROVED',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'EARNED',
          points: 200,
          status: 'VOID', // Void transaction should still count
          createdAt: new Date(),
        },
        {
          id: 'tx-3',
          type: 'SPENT',
          points: -50,
          status: 'APPROVED',
          createdAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points).toBe(250); // 100 + 200 - 50
    });

    it('should return 0 points if calculated points are negative', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'Test Customer',
      });

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tx-1',
          type: 'SPENT',
          points: -200,
          status: 'APPROVED',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'EARNED',
          points: 100,
          status: 'APPROVED',
          createdAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points).toBe(0); // Should not go below 0
      expect(data.tier).toBe('Standard');
    });

    it('should return correct tier based on points', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'Test Customer',
      });

      // Test Platinum tier (>= 1000 points)
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tx-1',
          type: 'EARNED',
          points: 1000,
          status: 'APPROVED',
          createdAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points).toBe(1000);
      expect(data.tier).toBe('Platinum');
    });

    it('should handle errors gracefully', async () => {
      (authenticateMobileToken as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/points/mobile', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch points');
    });
  });
});

