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
      
      // Use the images directly, assuming URLs from the static API are correctly encoded
      setImages(data.images || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching R2 images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Function to manually refresh images - now calls the live API
  const refreshImages = async () => {
    console.log('Refreshing images via live API...');
    // Don't set initialized false, directly call fetch for live data
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      // Call the new dynamic endpoint
      const response = await fetch(`/api/images/live?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch LIVE R2 images: ${response.statusText}`);
      }
      
      const data = await response.json();
      
       // Use the images directly from the live endpoint
      setImages(data.images || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing R2 images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error during refresh');
       // Maybe keep existing images on refresh failure?
       // setImages([]); 
    } finally {
      setLoading(false);
       // Keep initialized as true, we just refreshed
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