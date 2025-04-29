'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { R2Image } from '../app/utils/r2-client';

// Define the context type
interface R2ContextType {
  images: R2Image[];
  loading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  preloadNextImages: (currentIndex: number, count: number) => void;
}

// Create the context with default values
const R2Context = createContext<R2ContextType>({
  images: [],
  loading: true,
  error: null,
  refreshImages: async () => {},
  preloadNextImages: () => {}
});

// Base URL for the R2 Worker - Define it here for direct fetching
const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';

// Provider component that will wrap the app
export function R2Provider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<R2Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Only fetch images if they haven't been fetched yet
    if (!initialized) {
      fetchImages();
    }
  }, [initialized]);

  const fetchImages = async () => {
    console.log('Fetching initial images directly from R2 worker...');
    try {
      setLoading(true);
      // Fetch directly from the worker URL
      const response = await fetch(`${R2_WORKER_BASE_URL}/?list=true`);

      if (!response.ok) {
        throw new Error(`Failed to fetch initial images from R2 worker: ${response.statusText}`);
      }

      const data = await response.json();

      // Process worker response (assuming data.objects format)
      const formattedImages = (data.objects || []).map((obj: any) => { // Use any temporarily if R2WorkerObject not available
         const key = obj.key || obj.name || '';
         const encodedKey = encodeURIComponent(key);
         const format = key.split('.').pop() || 'jpg';
         const id = key.replace(/\.[^/.]+$/, "");
         return {
              id,
              url: `${R2_WORKER_BASE_URL}/${encodedKey}`,
              width: 1000, // Placeholder
              height: 1200, // Placeholder
              format,
              created: obj.uploaded || new Date().toISOString(),
              // Add key back if needed by parseFilename or other logic
              key: key
            };
      });

      // Use the formatted images directly from the worker
      setImages(formattedImages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching R2 images directly:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Function to manually refresh images - now calls the live API
  const refreshImages = async () => {
    console.log('Refreshing images directly from R2 worker...');
    try {
      setLoading(true);
      // Fetch directly from the worker URL
      const response = await fetch(`${R2_WORKER_BASE_URL}/?list=true`);

      if (!response.ok) {
        throw new Error(`Failed to fetch refreshed images from R2 worker: ${response.statusText}`);
      }

      const data = await response.json();

      // Process worker response (assuming data.objects format)
      const formattedImages = (data.objects || []).map((obj: any) => {
         const key = obj.key || obj.name || '';
         const encodedKey = encodeURIComponent(key);
         const format = key.split('.').pop() || 'jpg';
         const id = key.replace(/\.[^/.]+$/, "");
          return {
              id,
              url: `${R2_WORKER_BASE_URL}/${encodedKey}`,
              width: 1000, // Placeholder
              height: 1200, // Placeholder
              format,
              created: obj.uploaded || new Date().toISOString(),
              key: key
            };
      });

      // Use the formatted images directly from the worker
      setImages(formattedImages || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing R2 images directly:', err);
      setError(err instanceof Error ? err.message : 'Unknown error during refresh');
    } finally {
      setLoading(false);
    }
  };

  // Function to preload the next images
  const preloadNextImages = (currentIndex: number, count: number) => {
    if (!images.length) return;

    // Preload the next 'count' images
    for (let i = 1; i <= count; i++) {
      const nextIndex = (currentIndex + i) % images.length;
      if (nextIndex !== currentIndex && images[nextIndex]) {
        const image = new Image();
        image.src = images[nextIndex].url;
      }
    }
  };

  // The value that will be provided to consumers of this context
  const value = {
    images,
    loading,
    error,
    refreshImages,
    preloadNextImages
  };

  return (
    <R2Context.Provider value={value}>
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