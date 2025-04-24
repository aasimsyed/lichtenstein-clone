import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dujkb1y9j',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Define the types for Cloudinary resources and images
interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
}

export interface CloudinaryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created: string;
  placeholder?: string; // Base64 blur placeholder
}

// Cache for images to avoid refetching
let imageCache: CloudinaryImage[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate optimized Cloudinary URL with transformation parameters
 * @param baseUrl The original Cloudinary URL
 * @param options Optional transformation options
 * @returns Optimized Cloudinary URL
 */
export function getOptimizedImageUrl(
  baseUrl: string, 
  options: { 
    quality?: number; 
    format?: 'auto' | 'webp' | 'jpeg' | 'png'; 
    width?: number;
    dpr?: 'auto' | number;
  } = {}
): string {
  // Default options
  const {
    quality = 90,
    format = 'auto',
    width,
    dpr = 'auto'
  } = options;
  
  // Extract base URL without existing transformations
  const urlParts = baseUrl.split('/upload/');
  if (urlParts.length !== 2) return baseUrl;
  
  // Build transformation string
  let transformations = 'f_' + format;
  transformations += ',q_' + quality;
  if (width) transformations += ',w_' + width;
  transformations += ',dpr_' + dpr;
  
  // Add fetch format auto for best format for browser
  transformations += ',fl_progressive';
  
  // Apply transformations
  const optimizedUrl = urlParts[0] + '/upload/' + transformations + '/' + urlParts[1];
  
  // Remove timestamp if it exists
  return optimizedUrl.split('?')[0];
}

/**
 * Fetches images from Cloudinary
 * @param ignoreCache Whether to ignore the cached results
 * @returns A Promise resolving to an array of CloudinaryImage objects
 */
export async function fetchCloudinaryImages(ignoreCache = false): Promise<CloudinaryImage[]> {
  try {
    const now = Date.now();
    
    // Return cached images if available and not expired
    if (!ignoreCache && imageCache && (now - cacheTimestamp < CACHE_DURATION)) {
      return imageCache;
    }
    
    // Fetch images from the specified folder
    const result = await cloudinary.search
      .expression('folder:rupture/badges')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    // Transform the resources
    const images = result.resources.map((resource: CloudinaryResource) => ({
      id: resource.public_id,
      url: getOptimizedImageUrl(resource.secure_url, { quality: 85 }),
      width: resource.width,
      height: resource.height,
      format: resource.format,
      created: resource.created_at
    }));
    
    // Update cache
    imageCache = images;
    cacheTimestamp = now;
    
    return images;
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    // Return cached images if available, even if expired
    if (imageCache) {
      return imageCache;
    }
    return [];
  }
}

/**
 * Preloads the specified images for faster display
 * @param imageUrls Array of image URLs to preload
 */
export function preloadImages(imageUrls: string[]): void {
  if (typeof window === 'undefined') return; // Only run in browser
  
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preloads all catalog images in the background
 */
export async function preloadAllCatalogImages(): Promise<void> {
  if (typeof window === 'undefined') return; // Only run in browser
  
  try {
    const images = await fetchCloudinaryImages();
    
    // Preload first 10 images with high priority
    preloadImages(images.slice(0, 10).map(img => img.url));
    
    // Preload the rest with low priority after a delay
    setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = '/catalogue';
      document.head.appendChild(link);
      
      // Preload remaining images with lower quality for thumbnails
      images.slice(10).forEach(img => {
        const thumbnailUrl = getOptimizedImageUrl(img.url, { width: 300, quality: 60 });
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = thumbnailUrl;
        document.head.appendChild(link);
      });
    }, 3000); // 3 seconds delay
  } catch (error) {
    console.error('Error preloading catalog images:', error);
  }
} 