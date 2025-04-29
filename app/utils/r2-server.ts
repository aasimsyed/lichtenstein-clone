// app/utils/r2-server.ts
// Server-side utilities for R2 image handling

// Configuration for R2
const R2_IMAGE_BASE_URL = process.env.R2_IMAGE_BASE_URL || 'https://r2-image-worker.aasim-ss.workers.dev';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'better-badges';
const S3_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://950035267d1186d83269e8b8eb50e572.r2.cloudflarestorage.com';

// Debug R2 environment variables (without showing secrets)
console.log('R2 Configuration Check:', {
  R2_IMAGE_BASE_URL_SET: !!R2_IMAGE_BASE_URL,
  CF_ACCOUNT_ID_SET: !!CF_ACCOUNT_ID,
  CF_API_TOKEN_SET: !!CF_API_TOKEN,
  R2_BUCKET_NAME_SET: !!R2_BUCKET_NAME,
  S3_ACCESS_KEY_ID_SET: !!S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY_SET: !!S3_SECRET_ACCESS_KEY,
  R2_ENDPOINT_SET: !!R2_ENDPOINT,
  R2_IMAGE_BASE_URL: R2_IMAGE_BASE_URL
});

// Define R2 resource structure
export interface R2Resource {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
  url: string;
}

// Define optimized image structure
export interface R2Image {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created: string;
}

// Add new interface for Worker response object
// Add this after the R2Image interface

// Define R2 worker object structure
export interface R2WorkerObject {
  key: string;
  name?: string; // Some workers might return 'name' instead of 'key'
  size: number;
  etag: string;
  uploaded: string;
  httpMetadata?: {
    contentType?: string;
  };
}

// Cache for storing fetched images to avoid unnecessary API calls
let cachedImages: R2Image[] | null = null;

/**
 * Fetch images from R2 bucket
 */
export async function fetchR2Images(): Promise<R2Resource[]> {
  try {
    console.log('Fetching real images from R2...');

    // Use fetch to call the worker endpoint with a special admin path to list objects
    if (R2_IMAGE_BASE_URL) {
      const response = await fetch(`${R2_IMAGE_BASE_URL}/?list=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully fetched ${data.objects?.length || 0} images from R2 worker`);
        
        // Transform the results into our expected format
        return (data.objects || []).map((obj: R2WorkerObject) => {
          const key = obj.key || obj.name || '';  // Use empty string as fallback
          // Properly encode the URL to handle spaces and special characters
          const encodedKey = encodeURIComponent(key);
          return {
            key,
            size: obj.size || 0,
            etag: obj.etag || '',
            uploaded: obj.uploaded || new Date().toISOString(),
            url: `${R2_IMAGE_BASE_URL}/${encodedKey}`,
          };
        });
      } else {
        console.error('Error fetching from R2 worker: Response not OK', response.status);
        throw new Error(`Failed to fetch from R2 worker: ${response.status} ${response.statusText}`);
      }
    } else {
      throw new Error('R2_IMAGE_BASE_URL is not configured');
    }
  } catch (error) {
    console.error('Error in fetchR2Images:', error);
    throw error; // Re-throw the error so we know something went wrong
  }
}

/**
 * Generate optimized image URL for R2
 */
export function getOptimizedR2Url(
  key: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  // Encode the key to handle spaces and special characters
  const encodedKey = encodeURIComponent(key);
  
  // Create a URL for the image
  const url = new URL(`${R2_IMAGE_BASE_URL}/${encodedKey}`);
  
  // Add transformation parameters to the URL if provided
  if (options.width) {
    url.searchParams.append('width', options.width.toString());
  }
  if (options.height) {
    url.searchParams.append('height', options.height.toString());
  }
  if (options.quality) {
    url.searchParams.append('quality', options.quality.toString());
  }
  if (options.format) {
    url.searchParams.append('format', options.format);
  }
  
  return url.toString();
}

/**
 * Get optimized R2 images
 */
export async function getOptimizedR2Images(refresh = false): Promise<R2Image[]> {
  // Return cached images if available and refresh is not requested
  if (cachedImages && !refresh) {
    return cachedImages;
  }

  try {
    // Fetch resources from R2
    const resources = await fetchR2Images();
    
    // If resources is empty, return empty array
    if (resources.length === 0) {
      return [];
    }

    // Process each resource to create optimized images
    const optimizedImages = resources.map((resource) => {
      // Extract format from the file extension
      const format = resource.key.split('.').pop() || 'jpg';
      
      // Generate a unique ID from the key
      const id = resource.key.replace(/\.[^/.]+$/, ""); // Remove extension
      
      return {
        id,
        url: resource.url,
        width: 1000, // Placeholder width
        height: 1200, // Placeholder height
        format,
        created: resource.uploaded,
      };
    });

    // Cache the results
    cachedImages = optimizedImages;
    
    console.log(`Processed ${optimizedImages.length} optimized R2 images`);

    return optimizedImages;
  } catch (error) {
    console.error('Error optimizing R2 images:', error);
    return [];
  }
} 