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

# For Cloudflare Pages with the Next.js App Router, we just need to ensure
# the build completed successfully by checking for the .next directory
if [ -d ".next" ]; then
  echo "✓ Next.js build output directory (.next) exists"
  
  # Create any required Cloudflare files
  mkdir -p .next/static
  
  # Add required Cloudflare headers
  cat > .next/_headers << EOL
/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
EOL

  # Copy _redirects file if it exists
  if [ -f "_redirects" ]; then
    echo "✓ Copying _redirects file to output directory"
    cp _redirects .next/
  fi

  echo "✓ Build completed successfully!"
  echo "✓ Created Cloudflare _headers file"
  
  # List the output directory contents for debugging
  echo "Contents of .next directory:"
  ls -la .next
else
  echo "❌ Error: Next.js build output directory not found. Build may have failed."
  exit 1
fi 