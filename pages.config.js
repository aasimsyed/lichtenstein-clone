module.exports = {
  // Specify Node.js version for Cloudflare Pages
  nodeVersion: 20,
  
  // Build command
  buildCommand: 'npm run build',
  
  // Output directory
  outputDirectory: 'out',
  
  // Environment variables
  environment: {
    NODE_VERSION: '20'
  }
} 