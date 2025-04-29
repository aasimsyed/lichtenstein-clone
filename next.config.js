import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add static export configuration for Cloudflare Pages
  output: 'export',
  // Images configuration with static export settings
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
};

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

export default nextConfig; 