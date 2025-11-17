#!/usr/bin/env node

/**
 * This script helps migrate Cloudinary image components to R2Image components
 * Usage: node scripts/migrate-cloudinary-to-r2.js <path>
 *   - Where path is the directory or file to scan for Cloudinary image components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if a directory path was provided
const targetPath = process.argv[2] || './app';

// Function to search for Cloudinary image components in a file
function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
    return;
  }

  console.log(`Processing file: ${filePath}`);

  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for Cloudinary imports
  const hasCloudinaryImport = /import.*['"](.*cloudinary)['"]/i.test(content);
  const hasCloudinaryImage = /<CldImage/i.test(content);

  if (!hasCloudinaryImport && !hasCloudinaryImage) {
    return;
  }

  console.log(`  Found Cloudinary usage in: ${filePath}`);

  // Do not modify the file automatically - this is just a scanner to find files that need to be updated
  console.log(`  Please manually update this file to use R2Image component:\n`);
  console.log(`  Migration steps:`);
  console.log(`    1. Import the R2Image component: import R2Image from '../components/R2Image';`);
  console.log(`    2. Replace <CldImage> with <R2Image>`);
  console.log(`    3. Update the props accordingly (src instead of cloudName/publicId)`);
  console.log(`    4. Remove Cloudinary imports`);
  console.log();
}

// Recursively process a directory
function processDirectory(directoryPath) {
  const items = fs.readdirSync(directoryPath);

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Skip node_modules and .next directories
      if (item === 'node_modules' || item === '.next' || item === '.git') {
        continue;
      }
      processDirectory(itemPath);
    } else if (stats.isFile()) {
      processFile(itemPath);
    }
  }
}

// Start the migration process
console.log(`Starting migration scan from: ${targetPath}`);

if (fs.existsSync(targetPath)) {
  const stats = fs.statSync(targetPath);
  
  if (stats.isDirectory()) {
    processDirectory(targetPath);
  } else if (stats.isFile()) {
    processFile(targetPath);
  }
} else {
  console.error(`Error: Path does not exist: ${targetPath}`);
  process.exit(1);
}

console.log(`Migration scan complete. Please manually update the files as needed.`); 