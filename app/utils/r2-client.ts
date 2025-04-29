'use client';

// Define the types for R2 resources and images
export interface R2Image {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created: string;
  placeholder?: string; // Base64 blur placeholder
  responsiveUrls?: Record<string, string>; // URLs for different breakpoints
}

// Define R2 object structure returned from worker
export interface R2WorkerObject {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
  httpMetadata?: {
    contentType?: string;
  };
}

// Cache for images to avoid refetching
let imageCache: R2Image[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Base URL for the R2 Worker
// Allow both hostnames to work with the same code
const R2_IMAGE_BASE_URLS = [
  'https://r2-image-worker.aasim-ss.workers.dev',
  'https://images.better-badges.com'
];

/**
 * Generate optimized R2 URL with transformation parameters
 */
export function getOptimizedImageUrl(
  baseUrl: string, 
  options: { 
    quality?: number; 
    format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'avif'; 
    width?: number;
    height?: number;
  } = {}
): string {
  // Check if this is already an R2 URL
  const isR2Url = R2_IMAGE_BASE_URLS.some(baseR2Url => baseUrl.includes(baseR2Url));
  
  if (!isR2Url) {
    // Extract just the filename from a URL if transitioning
    const parts = baseUrl.split('/');
    const filename = parts[parts.length - 1];
    baseUrl = `${R2_IMAGE_BASE_URLS[0]}/${encodeURIComponent(filename)}`; // Use the first base URL with proper encoding
  } else {
    // If it is an R2 URL, ensure the path portion is encoded
    const url = new URL(baseUrl);
    const path = url.pathname.split('/');
    // Get the filename portion (last part)
    const filename = path[path.length - 1];
    // Reconstruct the URL with encoded filename
    baseUrl = `${url.origin}${url.pathname.substring(0, url.pathname.lastIndexOf('/'))}/${encodeURIComponent(filename)}${url.search}`;
  }
  
  // For now, return the URL without transformations since R2 worker doesn't support them
  return baseUrl;
  
  // Uncomment this when image transformations are implemented on the R2 worker
  /*
  // Default options
  const {
    quality = 85,
    format,
    width,
    height
  } = options;
  
  // Build URL with transformation parameters
  const url = new URL(baseUrl);
  
  // Add transformation parameters
  if (quality) url.searchParams.set('quality', quality.toString());
  if (format) url.searchParams.set('format', format);
  if (width) url.searchParams.set('width', width.toString());
  if (height) url.searchParams.set('height', height.toString());
  
  return url.toString();
  */
}

/**
 * Check if WebP format is supported in the current browser
 */
export function isWebPSupported(): boolean {
  if (typeof document === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext) return false;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Check if AVIF format is supported in the current browser
 */
export function isAvifSupported(): boolean {
  return false; // For now, assume AVIF is not supported as it's not widely implemented yet
}

/**
 * Get the best image format for the current browser
 */
export function getBestImageFormat(): 'webp' | 'avif' | 'jpeg' {
  if (isAvifSupported()) return 'avif';
  if (isWebPSupported()) return 'webp';
  return 'jpeg';
}

/**
 * Generate responsive image URLs for different breakpoints
 */
export function generateResponsiveUrls(baseUrl: string): Record<string, string> {
  const breakpoints = [320, 480, 640, 768, 1024, 1280, 1536];
  const responsiveUrls: Record<string, string> = {};
  
  for (const width of breakpoints) {
    responsiveUrls[width.toString()] = getOptimizedImageUrl(baseUrl, {
      width,
      format: getBestImageFormat()
    });
  }
  
  return responsiveUrls;
}

/**
 * Fetch all images via API route
 */
export async function fetchR2Images(ignoreCache = false): Promise<R2Image[]> {
  // Check if we have cached data and it's still fresh
  const now = Date.now();
  if (!ignoreCache && imageCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return imageCache;
  }
  
  try {
    console.log('Fetching R2 images from API route or worker');
    
    // First try to fetch directly from the R2 worker if available
    try {
      const directResponse = await fetch(`${R2_IMAGE_BASE_URLS[0]}/?list=true`);
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`Successfully fetched ${data.objects?.length || 0} images directly from R2 worker`);
        
        if (data.objects && Array.isArray(data.objects) && data.objects.length > 0) {
          // Transform the objects into our expected format
          const images = data.objects.map((obj: R2WorkerObject) => {
            const format = obj.key.split('.').pop() || 'jpg';
            const id = obj.key.replace(/\.[^/.]+$/, ""); // Remove extension
            
            // Properly encode the key
            const encodedKey = encodeURIComponent(obj.key);
            
            return {
              id,
              url: `${R2_IMAGE_BASE_URLS[0]}/${encodedKey}`,
              width: 1000, // Placeholder width
              height: 1200, // Placeholder height
              format,
              created: obj.uploaded || new Date().toISOString(),
            };
          });
          
          // Update cache
          imageCache = images;
          cacheTimestamp = now;
          
          return images;
        }
      }
    } catch (directError) {
      console.warn('Failed to fetch directly from R2 worker, falling back to API route:', directError);
    }
    
    // Fallback to the API route
    const cacheBuster = ignoreCache ? `?t=${now}` : '';
    const response = await fetch(`/api/images${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch images from API route');
    }
    
    const data = await response.json();
    
    if (!data.images || !Array.isArray(data.images)) {
      throw new Error('Invalid response format from images API');
    }
    
    console.log(`Fetched ${data.images.length} images from API route`);
    
    // Update cache
    imageCache = data.images;
    cacheTimestamp = now;
    
    return data.images;
  } catch (error) {
    console.error('Error fetching images:', error);
    // Return empty array or cached data if available
    return imageCache || [];
  }
}

/**
 * Preload images efficiently
 */
export function preloadImagesEfficiently(urls: string[]): void {
  if (!urls.length) return;
  
  // Create a queue for preloading
  const preloadQueue = [...urls];
  
  // Preload at most 5 images at a time to avoid overwhelming the browser
  const preloadBatch = (batchSize = 5) => {
    const batch = preloadQueue.splice(0, batchSize);
    
    if (batch.length === 0) return;
    
    batch.forEach((url) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        // When an image is loaded or fails, load the next one in the queue
        if (preloadQueue.length > 0) {
          preloadBatch(1); // Load one more
        }
      };
      img.src = url;
    });
  };
  
  // Start preloading
  preloadBatch();
}

/**
 * Preloads all catalog images in the background
 */
export async function preloadAllCatalogImages(): Promise<void> {
  try {
    const images = await fetchR2Images();
    if (!images || images.length === 0) return;
    
    // Generate optimized URLs for each image
    const imageUrls = images.map(img => getOptimizedImageUrl(img.url, {
      width: 800,
      quality: 85,
      format: getBestImageFormat()
    }));
    
    // Preload efficiently
    preloadImagesEfficiently(imageUrls);
  } catch (error) {
    console.error('Failed to preload catalog images:', error);
  }
} 