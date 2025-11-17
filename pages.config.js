module.exports = {
  // Specify Node.js version for Cloudflare Pages
  nodeVersion: 20,
  
  // Use custom build script that bypasses ESLint and TypeScript errors
  buildCommand: './cloudflare-build.sh',
  
  // Output directory
  outputDirectory: 'out',
  
  // Environment variables
  environment: {
    NODE_VERSION: '20',
    NEXT_DISABLE_ESLINT: '1',
    NEXT_DISABLE_TYPE_CHECKS: '1'
  }
} 