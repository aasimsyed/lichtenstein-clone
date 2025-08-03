// Image optimization utility for Cloudflare Images transformations
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
  
  // Extract the image path from the R2 worker URL
  const urlObj = new URL(originalUrl);
  const imagePath = urlObj.pathname;
  
  // Build transformation parameters
  const params: string[] = [];
  
  if (config.width) params.push(`w=${config.width}`);
  if (config.height) params.push(`h=${config.height}`);
  if (config.quality) params.push(`q=${config.quality}`);
  if (config.format) params.push(`f=${config.format}`);
  if (config.fit) params.push(`fit=${config.fit}`);
  
  // Use Cloudflare's image transformation endpoint
  // This works with any publicly accessible image, including R2
  const transformationUrl = `/cdn-cgi/image/${params.join(',')}${originalUrl}`;
  
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
export function getImageUrlForContext(
  originalUrl: string, 
  context: 'admin-thumbnail' | 'series-grid' | 'catalogue-grid' | 'modal' | 'full'
): string {
  const contextSizeMap: Record<typeof context, ImageSize> = {
    'admin-thumbnail': 'thumbnail',
    'series-grid': 'small', 
    'catalogue-grid': 'medium',
    'modal': 'large',
    'full': 'full',
  };
  
  return getOptimizedImageUrl(originalUrl, contextSizeMap[context]);
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