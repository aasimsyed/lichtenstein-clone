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