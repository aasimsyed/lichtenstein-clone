// Image optimization utility for Next.js custom loader
// This enables dynamic resizing and optimization of R2 images

export interface ImageSizeConfig {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

export const IMAGE_SIZES = {
  // Thumbnail for admin/grid views
  thumbnail: { width: 150, height: 180, quality: 80, format: 'auto' as const, fit: 'cover' as const },
  
  // Small for series grid
  small: { width: 200, height: 240, quality: 85, format: 'auto' as const, fit: 'cover' as const },
  
  // Medium for catalogue grid
  medium: { width: 400, height: 480, quality: 85, format: 'auto' as const, fit: 'scale-down' as const },
  
  // Large for modal/detail view
  large: { width: 800, height: 960, quality: 90, format: 'auto' as const, fit: 'scale-down' as const },
  
  // Full resolution (original)
  full: { quality: 95, format: 'auto' as const, fit: 'scale-down' as const },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Generate optimized image URL using Cloudflare Images transformations
 * For R2 images, this uses the /cdn-cgi/image/ transformation endpoint
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  size: ImageSize | ImageSizeConfig = 'medium'
): string {
  // Handle both predefined sizes and custom configs
  const config = typeof size === 'string' ? IMAGE_SIZES[size] : size;
  
  // Build transformation parameters
  const params: string[] = [];
  
  if (config.width) params.push(`w=${config.width}`);
  if (config.height) params.push(`h=${config.height}`);
  if (config.quality) params.push(`q=${config.quality}`);
  if (config.format) params.push(`f=${config.format}`);
  if (config.fit) params.push(`fit=${config.fit}`);
  
  // Use R2 worker's image transformation endpoint as fallback
  // Extract the image key from the R2 URL
  const imageUrlObj = new URL(originalUrl);
  const imageKey = imageUrlObj.pathname.slice(1); // Remove leading slash
  
  // Build transformation URL using R2 worker
  const transformationUrl = `https://r2-image-worker.aasim-ss.workers.dev/${imageKey}?${params.join('&')}`;
  
  return transformationUrl;
}

/**
 * Generate multiple sizes for responsive images
 */
export function getResponsiveImageUrls(originalUrl: string) {
  return {
    thumbnail: getOptimizedImageUrl(originalUrl, 'thumbnail'),
    small: getOptimizedImageUrl(originalUrl, 'small'),
    medium: getOptimizedImageUrl(originalUrl, 'medium'),
    large: getOptimizedImageUrl(originalUrl, 'large'),
    full: getOptimizedImageUrl(originalUrl, 'full'),
    original: originalUrl, // Fallback to original
  };
}

/**
 * Get the appropriate image size based on context
 */
/**
 * Next.js Image Custom Loader
 * This function is called by Next.js Image component for optimization
 */
export function nextImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // For R2 images, extract the image key and build optimized URL
  if (src.includes('r2-image-worker.aasim-ss.workers.dev')) {
    const urlObj = new URL(src);
    const imageKey = urlObj.pathname.slice(1);
    
    // Build query params for optimization
    const params = new URLSearchParams();
    params.set('w', width.toString());
    params.set('q', (quality || 85).toString());
    params.set('f', 'webp'); // Use WebP for better compression
    
    return `https://r2-image-worker.aasim-ss.workers.dev/${imageKey}?${params.toString()}`;
  }
  
  // For external images or fallback, return original
  return src;
}

// Default export for Next.js custom loader
export default nextImageLoader;

export function getImageUrlForContext(
  originalUrl: string, 
  context: 'admin-thumbnail' | 'series-grid' | 'catalogue-grid' | 'modal' | 'full'
): string {
  // For Next.js Image component usage, return original URL
  // The optimization will be handled by the custom loader
  return originalUrl;
}

/**
 * Preload critical images for better performance
 */
export function preloadCriticalImages(imageUrls: string[], size: ImageSize = 'medium') {
  if (typeof window !== 'undefined') {
    imageUrls.slice(0, 6).forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedImageUrl(url, size);
      document.head.appendChild(link);
    });
  }
}