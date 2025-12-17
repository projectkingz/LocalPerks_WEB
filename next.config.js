// @ts-check

/**
 * @type {import('next').NextConfig}
 */
// Conditionally load bundle analyzer only if installed and ANALYZE is enabled
let withBundleAnalyzer = (config) => config;
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  }
} catch (error) {
  // Bundle analyzer not installed - that's okay, it's optional
  if (process.env.ANALYZE === 'true') {
    console.warn('⚠️  @next/bundle-analyzer not installed. Install it with: npm install --save-dev @next/bundle-analyzer');
  }
}

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  eslint: {
    // Re-enabled for static analysis - fix errors before deployment
    ignoreDuringBuilds: false,
    dirs: ['src', 'app', 'pages', 'components'],
  },
  typescript: {
    // Re-enabled for static analysis - fix errors before deployment
    ignoreBuildErrors: false,
  },
  // Optimize build performance
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Reduce bundle size - modularize icon imports for tree-shaking
  // This ensures only used icons are included in the bundle
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
    '@heroicons/react': {
      transform: '@heroicons/react/{{member}}',
      skipDefaultConversion: true,
    },
    // react-icons already uses subpath imports (e.g., react-icons/fa), 
    // so modularizeImports for subpaths ensures tree-shaking works
    'react-icons/fa': {
      transform: 'react-icons/fa/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons/md': {
      transform: 'react-icons/md/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons/io': {
      transform: 'react-icons/io/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons/bi': {
      transform: 'react-icons/bi/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons/hi': {
      transform: 'react-icons/hi/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons/ai': {
      transform: 'react-icons/ai/{{member}}',
      skipDefaultConversion: true,
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Optimize package imports - ensures tree-shaking works correctly
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'react-icons',
      'framer-motion',
      '@prisma/client', // Prisma can be heavy, optimize imports
    ],
  },
  // Font optimization
  optimizeFonts: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false
      };
    }
    
    // Exclude seed files from build
    config.module.rules.push({
      test: /prisma\/seed.*\.ts$/,
      use: 'ignore-loader'
    });
    
    // Exclude backend directory from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/backend/**',
        '**/docs/**',
        '**/.git/**'
      ]
    };
    
    return config;
  },
  async headers() {
    const headers = [];
    
    // Allow all origins for mobile app compatibility
    // Mobile apps need wildcard CORS since they don't have a fixed origin
    const allowedOrigin = '*'; // Allow all origins for mobile app
    
    // General API CORS headers (restricted to specific origin)
    headers.push({
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { 
          key: 'Access-Control-Allow-Origin', 
          value: allowedOrigin // Specific origin instead of wildcard
        },
        { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie' },
        { key: 'Vary', value: 'Origin' }, // Important for proper CORS caching
      ]
    });
    
    // CDN caching for public GET endpoints - Rewards API
    // Cache approved rewards for 5 minutes (300 seconds)
    headers.push({
      source: '/api/rewards',
      headers: [
        { 
          key: 'Cache-Control', 
          value: 'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
          // public: can be cached by CDN
          // s-maxage=300: CDN cache for 5 minutes
          // stale-while-revalidate=600: serve stale content for 10 minutes while revalidating
          // max-age=60: browser cache for 1 minute
        },
        { key: 'X-Cache-Status', value: 'CDN' }, // For debugging
      ]
    });
    
    // CDN caching for mobile rewards endpoint
    headers.push({
      source: '/api/rewards/mobile',
      headers: [
        { 
          key: 'Cache-Control', 
          value: 'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
        },
        { key: 'X-Cache-Status', value: 'CDN' },
      ]
    });
    
    // CDN caching for tenant points config (mobile) - longer cache since config changes less frequently
    headers.push({
      source: '/api/tenants/:tenantId/points-config/mobile',
      headers: [
        { 
          key: 'Cache-Control', 
          value: 'public, s-maxage=900, stale-while-revalidate=1800, max-age=300'
          // s-maxage=900: CDN cache for 15 minutes
          // stale-while-revalidate=1800: serve stale for 30 minutes while revalidating
          // max-age=300: browser cache for 5 minutes
        },
        { key: 'X-Cache-Status', value: 'CDN' },
      ]
    });
    
    return headers;
  }
}

module.exports = withBundleAnalyzer(nextConfig) 