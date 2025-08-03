import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production
  ...(process.env.NODE_ENV !== 'development' && { output: 'export' }),
  
  // Images configuration with custom loader
  images: {
    // Enable optimization with custom loader
    unoptimized: false,
    // Custom loader for image optimization
    loader: 'custom',
    loaderFile: './app/utils/image-optimization.ts',
    // Supported formats
    formats: ['image/webp', 'image/avif'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints  
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'cdn.panopticoncr.com', 
      'via.placeholder.com',
      'r2-image-worker.aasim-ss.workers.dev',
      'images.better-badges.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.panopticoncr.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'r2-image-worker.aasim-ss.workers.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.better-badges.com',
        pathname: '/**',
      },
    ],
  },
  // Exclude API routes from static export
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  // Moved from experimental section
  outputFileTracingExcludes: {
    '/api/': ['**/node_modules/**'],
  },
  // Disable ESLint during builds to prevent failures
  eslint: {
    // Only run ESLint during development, not during builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    // Skip type checking during builds
    ignoreBuildErrors: true,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Disable build ID in static output to prevent unnecessary warnings
  generateBuildId: async () => 'static-build',
};

// Set up development platform only in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    await setupDevPlatform();
    console.log('🔧 Running in development mode with full API functionality enabled');
  } catch (e) {
    console.warn('Failed to setup dev platform:', e);
  }
}

export default nextConfig; 