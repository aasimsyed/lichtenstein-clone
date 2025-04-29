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

# Ensure the output directory exists
if [ -d "out" ]; then
  echo "✓ Output directory 'out' exists"
  # Copy _redirects file if it exists
  if [ -f "_redirects" ]; then
    echo "✓ Copying _redirects file to output directory"
    cp _redirects out/
  fi
else
  echo "❌ Error: Output directory 'out' not found. Build may have failed."
  exit 1
fi

# Create special directories/files required by Cloudflare Pages if needed
mkdir -p out/_headers || true

# Always attempt to create/overwrite the _headers file
echo "✓ Ensuring _headers file exists with content"
rm -f out/_headers # Ensure it's not a directory
cat > out/_headers << EOL
/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
EOL

echo "✓ Build completed successfully!"
ls -la out 