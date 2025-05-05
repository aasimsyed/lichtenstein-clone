import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Cloudflare Pages
  output: 'export',
  
  // Images configuration
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com', 
      'cdn.panopticoncr.com', 
      'via.placeholder.com',
      'r2-image-worker.aasim-ss.workers.dev',
      'images.better-badges.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
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
};

// Set up development platform only in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    await setupDevPlatform();
  } catch (e) {
    console.warn('Failed to setup dev platform:', e);
  }
}

export default nextConfig; 