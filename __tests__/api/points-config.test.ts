/**
 * Tests for /api/points/config endpoint
 * Used by React Native app to fetch points configuration
 */

import { GET, OPTIONS } from '@/app/api/points/config/route';
import { NextRequest } from 'next/server';
import { authenticateMobileToken } from '@/lib/auth/mobile-auth';
import { getTenantPointsConfig } from '@/lib/pointsCalculation';
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
    tenant: {
      findFirst: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/pointsCalculation', () => ({
  getTenantPointsConfig: jest.fn(),
}));

jest.mock('@/lib/pointsConfig', () => ({
  defaultPointsConfig: {
    pointFaceValue: 0.01,
    systemFixedCharge: 0.001,
    systemVariableCharge: 0.06,
  },
}));

describe('/api/points/config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('OPTIONS', () => {
    it('should return CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/points/config', {
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

      const request = new NextRequest('http://localhost:3000/api/points/config', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.debug).toBeDefined();
    });

    it('should return points config for authenticated customer with mobile token', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        tenantId: 'tenant-1',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-1',
      });
      (getTenantPointsConfig as jest.Mock).mockResolvedValue({
        pointFaceValue: 0.01,
        systemFixedCharge: 0.001,
        systemVariableCharge: 0.06,
      });

      const request = new NextRequest('http://localhost:3000/api/points/config', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.config).toBeDefined();
      expect(data.tenantId).toBe('tenant-1');
    });

    it('should return points config for authenticated partner with mobile token', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'partner@example.com',
        role: 'PARTNER',
        tenantId: 'tenant-1',
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (getTenantPointsConfig as jest.Mock).mockResolvedValue({
        pointFaceValue: 0.01,
        systemFixedCharge: 0.001,
        systemVariableCharge: 0.06,
      });

      const request = new NextRequest('http://localhost:3000/api/points/config', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.config).toBeDefined();
      expect(data.tenantId).toBe('tenant-1');
    });

    it('should return default config if tenant not found', async () => {
      const mockUser = {
        userId: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        tenantId: null,
      };

      (authenticateMobileToken as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        tenantId: null,
      });

      const request = new NextRequest('http://localhost:3000/api/points/config', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.config).toBeDefined();
      expect(data.usingDefault).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (authenticateMobileToken as jest.Mock).mockRejectedValue(
        new Error('Authentication failed')
      );

      const request = new NextRequest('http://localhost:3000/api/points/config', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch points configuration');
    });
  });
});

