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
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/images?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch R2 images');
      }
      
      const data = await response.json();
      
      // Ensure all image URLs are properly encoded
      const encodedImages = (data.images || []).map((image: R2Image) => {
        try {
          // Parse URL and ensure the filename is properly encoded
          const url = new URL(image.url);
          const pathParts = url.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          
          // Reconstruct URL with encoded filename
          url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/')) + '/' + encodeURIComponent(filename);
          
          return {
            ...image,
            url: url.toString()
          };
        } catch (e) {
          console.warn(`Failed to encode URL: ${image.url}`, e);
          return image;
        }
      });
      
      setImages(encodedImages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching R2 images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Function to manually refresh images
  const refreshImages = async () => {
    setInitialized(false);
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