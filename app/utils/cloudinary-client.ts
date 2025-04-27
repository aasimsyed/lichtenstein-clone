/**
 * Client-side Cloudinary utilities that don't directly use the Cloudinary SDK
 * This file is safe to import in client components
 */

// Client-side utilities for Cloudinary that don't directly use the Cloudinary SDK
'use client';

// Define the types for Cloudinary resources and images
export interface CloudinaryResource {
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
  responsiveUrls?: Record<string, string>; // URLs for different breakpoints
}

// Cache for images to avoid refetching
let imageCache: CloudinaryImage[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Interface for connection information
interface ConnectionInfo {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  saveData?: boolean;
  downlink?: number; // Mbps
}

// Define Navigator with NetworkInformation interface
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  saveData?: boolean;
  downlink?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

// Shared memory cache for preloaded images
const preloadCache = new Set<string>();

/**
 * Get current connection information
 */
function getConnectionInfo(): ConnectionInfo {
  if (typeof navigator === 'undefined') return {};
  
  const nav = navigator as NavigatorWithConnection;
  const conn = nav.connection;
  
  return {
    effectiveType: conn?.effectiveType,
    saveData: conn?.saveData,
    downlink: conn?.downlink
  };
}

/**
 * Get optimal image quality based on connection
 */
function getOptimalQuality(connectionInfo: ConnectionInfo): number {
  // Default to high quality
  if (!connectionInfo.effectiveType) return 85;
  
  // Adjust quality based on connection
  switch (connectionInfo.effectiveType) {
    case '4g': return connectionInfo.saveData ? 70 : 85;
    case '3g': return 65;
    case '2g': 
    case 'slow-2g':
      return 55;
    default: return 75;
  }
}

/**
 * Generate responsive breakpoints for an image URL
 */
export function generateResponsiveBreakpoints(baseUrl: string, widths: number[] = [320, 640, 960, 1280, 1600]): Record<string, string> {
  const result: Record<string, string> = {};
  const connectionInfo = getConnectionInfo();
  const quality = getOptimalQuality(connectionInfo);

  // Generate URLs for different widths
  widths.forEach(width => {
    result[width.toString()] = getOptimizedImageUrl(baseUrl, { 
      width, 
      quality, 
      format: 'auto' 
    });
  });

  return result;
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
  sizes: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    'default': '33vw'
  }
): string {
  return Object.entries(sizes)
    .map(([breakpoint, size]) => {
      return breakpoint !== 'default' ? `${breakpoint} ${size}` : size;
    })
    .join(', ');
}

/**
 * Generate optimized Cloudinary URL with transformation parameters
 * Using transformation URL patterns directly instead of relying on SDK
 */
export function getOptimizedImageUrl(
  baseUrl: string, 
  options: { 
    quality?: number; 
    format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'avif'; 
    width?: number;
    height?: number;
    dpr?: 'auto' | number;
    crop?: 'fill' | 'fit' | 'limit';
    gravity?: 'auto' | 'face' | 'center';
    blur?: number;
  } = {}
): string {
  // Default options
  const {
    quality = 85,
    format = 'auto',
    width,
    height,
    dpr = 'auto',
    crop,
    gravity = 'auto',
    blur
  } = options;
  
  // Extract base URL without existing transformations
  const urlParts = baseUrl.split('/upload/');
  if (urlParts.length !== 2) return baseUrl;
  
  // Build transformation string
  const transformations: string[] = [];
  
  // Format and quality transformations
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);
  
  // Add crop if specified
  if (crop && (width || height)) {
    transformations.push(`c_${crop}`);
    transformations.push(`g_${gravity}`);
  }
  
  // Dimension transformations
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  
  // DPR setting
  transformations.push(`dpr_${dpr}`);
  
  // Progressive loading
  transformations.push('fl_progressive');
  
  // Add blur if needed
  if (blur && blur > 0) {
    transformations.push(`e_blur:${blur}`);
  }
  
  // Apply transformations
  const optimizedUrl = `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`;
  
  // Remove timestamp if it exists
  return optimizedUrl.split('?')[0];
}

/**
 * Create a low quality placeholder image URL
 */
export function getLQIPUrl(baseUrl: string): string {
  return getOptimizedImageUrl(baseUrl, {
    width: 20,
    quality: 30,
    blur: 1000
  });
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
export function isAVIFSupported(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof Image === 'undefined') return false;

  return document.createElement('canvas')
    .toDataURL('image/avif')
    .indexOf('data:image/avif') === 0;
}

/**
 * Get the best image format based on browser support
 */
export function getBestImageFormat(): 'auto' | 'webp' | 'avif' | 'jpeg' {
  if (isAVIFSupported()) return 'avif';
  if (isWebPSupported()) return 'webp';
  return 'jpeg';
}

/**
 * Fetch Cloudinary images via API route
 */
export async function fetchCloudinaryImages(ignoreCache = false): Promise<CloudinaryImage[]> {
  // Check if we have cached data and it's still fresh
  const now = Date.now();
  if (!ignoreCache && imageCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return imageCache;
  }
  
  try {
    // Add cache-busting parameter if ignoring cache
    const cacheBuster = ignoreCache ? `?t=${now}` : '';
    
    // Fetch from API route
    const response = await fetch(`/api/cloudinary${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Cloudinary images');
    }
    
    const data = await response.json();
    
    if (!data.images || !Array.isArray(data.images)) {
      throw new Error('Invalid response format from Cloudinary API');
    }
    
    // Update cache
    imageCache = data.images;
    cacheTimestamp = now;
    
    return data.images;
  } catch (error) {
    console.error('Error fetching Cloudinary images:', error);
    // Return empty array or cached data if available
    return imageCache || [];
  }
}

/**
 * Preloads images into browser cache more efficiently
 * @param imageUrls Array of image URLs to preload
 * @param priority Whether to use high priority
 */
export function preloadImagesEfficiently(imageUrls: string[], priority = false): void {
  if (typeof window === 'undefined') return;
  
  // Skip if in data saver mode
  const nav = navigator as NavigatorWithConnection;
  if (nav.connection?.saveData) return;
  
  // Use setTimeout with different delays based on priority
  const schedulePreload = (callback: () => void): void => {
    setTimeout(callback, priority ? 0 : 500);
  };

  // Process in batches to avoid overloading the browser
  const batchSize = priority ? 5 : 2;
  const urls = [...imageUrls]; // Create a copy to avoid mutating the original
  
  const loadNextBatch = (): void => {
    if (urls.length === 0) return;
    
    const batch = urls.splice(0, batchSize);
    batch.forEach(url => {
      // Skip if already preloaded
      if (preloadCache.has(url)) return;
      
      // Add to preload cache
      preloadCache.add(url);
      
      // Create link preload for critical images
      if (priority) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      }
      
      // Also load into browser cache using Image API
      const img = new Image();
      img.src = url;
    });
    
    // Schedule next batch if there are more URLs
    if (urls.length > 0) {
      schedulePreload(loadNextBatch);
    }
  };
  
  // Start loading the first batch
  schedulePreload(loadNextBatch);
}

/**
 * Preloads all catalog images in the background
 */
export async function preloadAllCatalogImages(): Promise<void> {
  try {
    const images = await fetchCloudinaryImages();
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