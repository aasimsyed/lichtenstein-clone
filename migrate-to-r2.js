// migrate-to-r2.js
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// You'll need to install the Cloudflare SDK:
// npm install @cloudflare/api @cloudflare/workers-types node-fetch@2
import { Cloudflare } from '@cloudflare/api';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dujkb1y9j',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Initialize Cloudflare API client
const cf = new Cloudflare({
  token: process.env.CF_API_TOKEN,
});

const CLOUDFLARE_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const R2_BUCKET_NAME = 'better-badges-images';

async function migrateImagesToR2() {
  try {
    console.log('Starting migration from Cloudinary to R2...');
    
    // Step 1: Fetch all images from Cloudinary
    console.log('Fetching images from Cloudinary...');
    const result = await cloudinary.search
      .expression('folder:rupture/badges')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();
    
    if (!result.resources || result.resources.length === 0) {
      console.error('No images found in Cloudinary');
      return;
    }
    
    console.log(`Found ${result.resources.length} images in Cloudinary`);
    
    // Step 2: Process each image
    for (const [index, resource] of result.resources.entries()) {
      console.log(`Processing image ${index + 1}/${result.resources.length}: ${resource.public_id}`);
      
      try {
        // Download the image from Cloudinary
        console.log(`Downloading from Cloudinary: ${resource.secure_url}`);
        const response = await fetch(resource.secure_url);
        
        if (!response.ok) {
          console.error(`Failed to download image: ${resource.public_id}`);
          continue;
        }
        
        const imageData = await response.arrayBuffer();
        
        // Determine the target path in R2
        // Strip the folder prefix to keep a cleaner structure
        const targetPath = resource.public_id.replace('rupture/badges/', '');
        const contentType = `image/${resource.format}`;
        
        // Upload to R2
        console.log(`Uploading to R2: ${targetPath}`);
        
        // Using Cloudflare API to upload to R2
        await cf.r2.buckets.object.upload(CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, targetPath, imageData, {
          httpMetadata: {
            contentType: contentType,
          }
        });
        
        console.log(`Successfully migrated: ${resource.public_id}`);
      } catch (error) {
        console.error(`Error processing image ${resource.public_id}:`, error);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateImagesToR2().catch(console.error); 