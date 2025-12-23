# Testing Guide for React Native App Endpoints

This guide explains how to test the API endpoints used by the React Native app.

## Prerequisites

Install testing dependencies:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/jest-dom @testing-library/react
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode (for development):
```bash
npm run test:watch
```

### Run only API endpoint tests:
```bash
npm run test:api
```

### Run tests with coverage:
```bash
npm run test:coverage
```

## Test Files

### 1. `/api/auth/mobile-login` (`__tests__/api/mobile-login.test.ts`)

Tests the mobile login endpoint used by the React Native app.

**Test Cases:**
- ✅ CORS headers (OPTIONS request)
- ✅ Missing email/password validation
- ✅ User not found
- ✅ User without password
- ✅ Incorrect password
- ✅ Suspended user
- ✅ Partner not approved
- ✅ Successful customer login with points and tier
- ✅ Successful partner login with tenant data
- ✅ Error handling

**Example Usage:**
```typescript
// Successful login
POST /api/auth/mobile-login
Body: { email: "customer@example.com", password: "password123" }
Response: { success: true, sessionToken: "jwt-token", user: {...} }
```

### 2. `/api/points/config` (`__tests__/api/points-config.test.ts`)

Tests the points configuration endpoint.

**Test Cases:**
- ✅ CORS headers (OPTIONS request)
- ✅ Unauthorized access (no token)
- ✅ Authenticated customer with mobile token
- ✅ Authenticated partner with mobile token
- ✅ Default config when tenant not found
- ✅ Error handling

**Example Usage:**
```typescript
// Get points config
GET /api/points/config
Headers: { Authorization: "Bearer jwt-token" }
Response: { success: true, config: {...}, tenantId: "tenant-1" }
```

### 3. `/api/points/mobile` (`__tests__/api/points-mobile.test.ts`)

Tests the mobile points endpoint that returns customer points and tier.

**Test Cases:**
- ✅ CORS headers (OPTIONS request)
- ✅ Unauthorized access (no token)
- ✅ Customer not found
- ✅ Points calculation from approved transactions
- ✅ Points calculation including void transactions
- ✅ Points never go below 0
- ✅ Tier calculation (Standard, Silver, Gold, Platinum)
- ✅ Error handling

**Example Usage:**
```typescript
// Get customer points
GET /api/points/mobile
Headers: { Authorization: "Bearer jwt-token" }
Response: { points: 500, tier: "Gold", customerId: "...", email: "...", name: "..." }
```

## Manual Testing

You can also test endpoints manually using curl or a tool like Postman:

### 1. Test Mobile Login

```bash
curl -X POST https://localperks-app.vercel.app/api/auth/mobile-login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password123"}'
```

### 2. Test Points Config (requires auth token)

```bash
# First, get a token from mobile-login, then:
curl -X GET https://localperks-app.vercel.app/api/points/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Points Mobile (requires auth token)

```bash
curl -X GET https://localperks-app.vercel.app/api/points/mobile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Test Environment Variables

Tests use mock environment variables defined in `jest.setup.js`:
- `NEXTAUTH_SECRET`: Test secret key
- `DATABASE_URL`: Mock database URL
- `PRISMA_ACCELERATE_ENDPOINT`: Mock Accelerate endpoint

## Writing New Tests

When adding new endpoints, create a test file in `__tests__/api/`:

```typescript
import { GET, POST } from '@/app/api/your-endpoint/route';
import { NextRequest } from 'next/server';

describe('/api/your-endpoint', () => {
  it('should handle request correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-endpoint');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toMatchObject({...});
  });
});
```

## Troubleshooting

### Tests failing with module not found errors:
- Ensure all dependencies are installed: `npm install`
- Check that `jest.config.js` has correct module name mapping

### Tests failing with Prisma errors:
- Tests use mocked Prisma client, so database connection is not required
- Check that mocks are set up correctly in test files

### Tests failing with authentication errors:
- Ensure mocks for `authenticateMobileToken` and `getServerSession` are set up
- Check that test environment variables are set in `jest.setup.js`

