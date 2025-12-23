// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Next.js web APIs in Node.js test environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db'
process.env.PRISMA_ACCELERATE_ENDPOINT = 'prisma+mysql://test-accelerate-endpoint'
process.env.NODE_ENV = 'test'

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// }

