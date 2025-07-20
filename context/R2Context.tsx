'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { R2Image } from '../app/utils/r2-client';

// Define the context type
interface R2ContextType {
  images: R2Image[];
  loading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  preloadNextImages: (currentIndex: number, count: number) => void;
  isImageReady: (imageUrl: string) => boolean;
}

// Create the context with default values
const R2Context = createContext<R2ContextType>({
  images: [],
  loading: true,
  error: null,
  refreshImages: async () => {},
  preloadNextImages: () => {},
  isImageReady: () => false
});

// Base URL for the R2 Worker - Define it here for direct fetching
const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';

// Persistent image state tracking between renders
const preloadedImages = new Set<string>();
const failedImages = new Set<string>();

// Provider component that will wrap the app
export function R2Provider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<R2Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  // Memoized fetch function to prevent recreation
  const fetchImages = useCallback(async (refresh = false) => {
    console.log(`${refresh ? 'Refreshing' : 'Fetching initial'} images directly from R2 worker...`);
    
    try {
      if (!refresh) {
        setLoading(true);
      }
      
      // Add cache busting for refresh requests
      const cacheBuster = refresh ? `&t=${Date.now()}` : '';
      const fetchUrl = `${R2_WORKER_BASE_URL}/?list=true${cacheBuster}`;
      console.log('Fetching from URL:', fetchUrl);
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch images from R2 worker: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw R2 response:', data);
      console.log('Number of objects in response:', data.objects?.length || 0);

      // Process worker response with memoization
      const formattedImages = (data.objects || []).map((obj: any) => {
         const key = obj.key || obj.name || '';
         const encodedKey = encodeURIComponent(key);
         const format = key.split('.').pop() || 'jpg';
         const id = key.replace(/\.[^/.]+$/, "");
         const url = `${R2_WORKER_BASE_URL}/${encodedKey}`;
         
         return {
              id,
              url,
              width: 1000, // Placeholder
              height: 1200, // Placeholder
              format,
              created: obj.uploaded || new Date().toISOString(),
              key: key
            };
      });

      // Use the formatted images directly from the worker
      console.log('Setting images, count:', formattedImages?.length || 0);
      console.log('Sample image keys (first 10):', formattedImages?.slice(0, 10).map(img => img.key));
      console.log('Sample image IDs (first 10):', formattedImages?.slice(0, 10).map(img => img.id));
      setImages(formattedImages || []);
      setError(null);
    } catch (err) {
      console.error(`Error ${refresh ? 'refreshing' : 'fetching'} R2 images directly:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      if (!refresh) {
        setInitialized(true);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (!initialized) {
      fetchImages(false);
    }
  }, [initialized, fetchImages]);

  // Function to manually refresh images
  const refreshImages = useCallback(async () => {
    return fetchImages(true);
  }, [fetchImages]);

  // Function to preload the next images - optimized
  const preloadNextImages = useCallback((currentIndex: number, count: number) => {
    if (!images.length) return;

    // Queue preloads to run asynchronously
    setTimeout(() => {
      // Preload the next 'count' images
      for (let i = 1; i <= count; i++) {
        const nextIndex = (currentIndex + i) % images.length;
        if (nextIndex !== currentIndex && images[nextIndex]) {
          const imageUrl = images[nextIndex].url;
          
          // Skip already preloaded or failed images
          if (preloadedImages.has(imageUrl) || failedImages.has(imageUrl)) {
            continue;
          }
          
          const image = new Image();
          image.onload = () => preloadedImages.add(imageUrl);
          image.onerror = () => failedImages.add(imageUrl);
          image.src = imageUrl;
        }
      }
    }, 0);
  }, [images]);
  
  // Function to check if an image is ready to display
  const isImageReady = useCallback((imageUrl: string): boolean => {
    return preloadedImages.has(imageUrl);
  }, []);

  // Memoize the context value to avoid unnecessary re-renders
  const contextValue = useMemo(() => ({
    images,
    loading,
    error,
    refreshImages,
    preloadNextImages,
    isImageReady
  }), [images, loading, error, refreshImages, preloadNextImages, isImageReady]);

  return (
    <R2Context.Provider value={contextValue}>
      {children}
    </R2Context.Provider>
  );
}

// Custom hook for using the R2 context
export function useR2Images() {
  const context = useContext(R2Context);
  
  if (context === undefined) {
    throw new Error('useR2Images must be used within a R2Provider');
  }
  
  return context;
} 