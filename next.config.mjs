/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for production
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    optimizePackageImports: ['firebase', '@firebase/firestore', 'lucide-react', 'recharts'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize Firebase imports - use modular SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app$': 'firebase/app',
      'firebase/firestore$': 'firebase/firestore',
      'firebase/auth$': 'firebase/auth',
      'firebase/storage$': 'firebase/storage',
    }

    // Split chunks for better caching and performance
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          firebase: {
            name: 'firebase',
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 5,
            minChunks: 2,
            maxSize: 244000,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 1,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // Optimize bundle size
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Headers for performance and security
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        },
      ],
    },
  ],

  // ESLint and TypeScript configurations for production
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Output configuration for Vercel
  output: 'standalone',
}

// Bundle analyzer (only when ANALYZE=true)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
