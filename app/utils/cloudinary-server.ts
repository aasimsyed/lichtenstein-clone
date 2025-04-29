// This file contains server-side Cloudinary utilities
// The 'use server' directive has been removed for static export compatibility

import { v2 as cloudinary } from 'cloudinary';
import { cache } from 'react';

// Check if required Cloudinary environment variables are set
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Debug Cloudinary environment variables (without showing secrets)
console.log('Cloudinary Configuration Check:', {
  CLOUD_NAME_SET: !!CLOUDINARY_CLOUD_NAME,
  API_KEY_SET: !!CLOUDINARY_API_KEY,
  API_SECRET_SET: !!CLOUDINARY_API_SECRET,
  CLOUD_NAME: CLOUDINARY_CLOUD_NAME
});

// Validate Cloudinary configuration
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    'Cloudinary environment variables are missing. Image optimization will not work correctly.',
    {
      cloud_name: CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      api_key: CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      api_secret: CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
    }
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || 'demo', // Fallback to demo account to prevent errors
  api_key: CLOUDINARY_API_KEY || '',
  api_secret: CLOUDINARY_API_SECRET || '',
  secure: true,
});

// Verify Cloudinary configuration by checking if config object is properly set
console.log('Cloudinary Config Status:', {
  isConfigured: !!cloudinary.config().cloud_name,
  cloudName: cloudinary.config().cloud_name
});

// Define Cloudinary resource structure
export interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  url: string;
  secure_url: string;
}

// Define optimized image structure
export interface CloudinaryImage {
  id: string;
  publicId: string;
  format: string;
  originalUrl: string;
  optimizedUrl: string;
  responsiveUrls: {
    [key: string]: string;
  };
  lqip: string;
  width: number;
  height: number;
  aspectRatio: number;
}

// Define transformation type
interface Transformation {
  [key: string]: string | number | undefined;
}

// Cache for storing fetched images to avoid unnecessary API calls
let cachedImages: CloudinaryImage[] | null = null;

/**
 * Fetches images from Cloudinary from a specific folder
 */
export const fetchCloudinaryImages = cache(async (folder: string = 'rupture/badges'): Promise<CloudinaryResource[]> => {
  // Validate credentials are set
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not set');
    return [];
  }
  
  try {
    console.log(`Fetching images from Cloudinary: ${folder}`);
    
    // Fetch resources in the specified folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500, // Adjust based on your needs
    });
    
    if (!result || !result.resources) {
      console.warn('No resources found in Cloudinary response');
      return [];
    }
    
    console.log(`Found ${result.resources.length} resources in folder: ${folder}`);
    
    // Sample resource for debugging
    if (result.resources.length > 0) {
      const sample = result.resources[0];
      console.log('Sample resource:', {
        public_id: sample.public_id,
        format: sample.format,
        width: sample.width,
        height: sample.height
      });
    }
    
    return result.resources;
  } catch (error) {
    console.error('Error fetching from Cloudinary:', error);
    return []; // Return empty array on error
  }
});

/**
 * Formats a Cloudinary URL with transformation parameters
 */
export function getCloudinaryUrl(publicId: string, options = {}) {
  const defaults = {
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    width: 800,
    height: 600
  };
  
  const params = { ...defaults, ...options };
  
  // Construct transformation string
  const transformation = `q_${params.quality},f_${params.format},c_${params.crop},w_${params.width},h_${params.height}`;
  
  // Return the complete URL
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
}

/**
 * Generate optimized Cloudinary URL with transformations
 */
export async function getOptimizedServerUrl(
  resource: CloudinaryResource | string,
  options: {
    crop?: string;
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
  } = {}
): Promise<string> {
  const public_id = typeof resource === 'string' 
    ? resource.split('/').pop()?.split('.')[0] || ''
    : resource.public_id;
  
  const { 
    crop = 'fill', 
    width, 
    height, 
    quality = 'auto', 
    format = 'auto' 
  } = options;

  // Base transformation parameters
  const transformations: Transformation[] = [];
  
  // Add crop, width and height if specified
  if (crop && (width || height)) {
    transformations.push({
      crop,
      width,
      height,
    });
  }
  
  // Add quality and format
  transformations.push({
    quality,
    fetch_format: format,
  });

  // Generate the URL with transformations
  return cloudinary.url(public_id, {
    secure: true,
    transformation: transformations,
  });
}

/**
 * Generate responsive breakpoints for images
 */
async function generateResponsiveBreakpoints(resource: CloudinaryResource): Promise<{ [key: string]: string }> {
  const breakpoints = [320, 480, 640, 768, 1024, 1280, 1536];
  const responsiveUrls: { [key: string]: string } = {};

  // Process breakpoints sequentially to avoid Promise.all which might cause rate limiting issues
  for (const width of breakpoints) {
    responsiveUrls[width.toString()] = await getOptimizedServerUrl(resource, {
      width,
      crop: 'fill',
    });
  }

  return responsiveUrls;
}

/**
 * Generate a low-quality image placeholder (LQIP)
 */
async function generateLQIP(resource: CloudinaryResource): Promise<string> {
  return getOptimizedServerUrl(resource, {
    width: 20,
    quality: 'auto:low',
  });
}

/**
 * Get optimized Cloudinary images with responsive URLs and LQIP
 */
export async function getOptimizedCloudinaryImages(refresh = false): Promise<CloudinaryImage[]> {
  // Return cached images if available and refresh is not requested
  if (cachedImages && !refresh) {
    return cachedImages;
  }

  try {
    // Fetch resources from Cloudinary
    const resources = await fetchCloudinaryImages();
    
    // If resources is empty, return empty array
    if (resources.length === 0) {
      return [];
    }

    // Process each resource to create optimized images
    const optimizedImages = await Promise.all(resources.map(async (resource) => {
      const { asset_id, public_id, format, width, height, secure_url } = resource;
      
      // Calculate aspect ratio
      const aspectRatio = width / height;

      // Generate optimized URL
      const optimizedUrl = await getOptimizedServerUrl(resource);

      // Generate responsive breakpoints
      const responsiveUrls = await generateResponsiveBreakpoints(resource);

      // Generate low-quality image placeholder
      const lqip = await generateLQIP(resource);

      // Return formatted CloudinaryImage object
      return {
        id: asset_id,
        publicId: public_id,
        format,
        originalUrl: secure_url,
        optimizedUrl,
        responsiveUrls,
        lqip,
        width,
        height,
        aspectRatio,
      };
    }));

    // Cache the results
    cachedImages = optimizedImages;

    return optimizedImages;
  } catch (error) {
    console.error('Error optimizing Cloudinary images:', error);
    return []; // Return empty array instead of throwing error
  }
} 