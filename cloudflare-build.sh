#!/bin/bash

# This script is used by Cloudflare Pages for building the project
# It explicitly sets environment variables to disable ESLint and TypeScript checking

# Print Node.js version for debugging
echo "Using Node.js version:"
node --version

# Set environment variables to disable ESLint and TypeScript checking
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_TYPE_CHECKS=1

# Run the build
npm run build

# For Cloudflare Pages with Next.js static export, we check for the 'out' directory
if [ -d "out" ]; then
  echo "✓ Next.js build output directory (out) exists"
  
  # Create any required Cloudflare files
  mkdir -p out/static
  
  # Add required Cloudflare headers
  cat > out/_headers << EOL
/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
EOL

  # Copy _redirects file if it exists
  if [ -f "_redirects" ]; then
    echo "✓ Copying _redirects file to output directory"
    cp _redirects out/
  fi

  # Create a script to inject environment variables at runtime
  # This helps with client-side authentication in static exports
  cat > out/env-config.js << EOL
// This script injects environment variables into the window object at runtime
window.__ENV__ = window.__ENV__ || {};
// Auth0 configuration
window.__ENV__.NEXT_PUBLIC_AUTH0_DOMAIN = '${NEXT_PUBLIC_AUTH0_DOMAIN}';
window.__ENV__.NEXT_PUBLIC_AUTH0_CLIENT_ID = '${NEXT_PUBLIC_AUTH0_CLIENT_ID}';
console.log('Runtime environment variables loaded');
EOL

  # Add the env-config.js script to the HTML files
  find out -name "*.html" -exec sed -i.bak -e '</head>/i\
  <script src="/env-config.js"></script>' {} \;
  
  # Remove backup files
  find out -name "*.html.bak" -delete

  echo "✓ Created runtime environment variables script"
  echo "✓ Build completed successfully!"
  echo "✓ Created Cloudflare _headers file"
  
  # List the output directory contents for debugging
  echo "Contents of out directory:"
  ls -la out
else
  echo "❌ Error: Next.js build output directory not found. Build may have failed."
  exit 1
fi 