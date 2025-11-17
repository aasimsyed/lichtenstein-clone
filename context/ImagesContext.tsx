'use client';

import React, { createContext, useState, useEffect } from 'react';
import { R2Image, fetchR2Images } from '../app/utils/r2-client';

// Define the context type
interface ImagesContextType {
  images: R2Image[];
  loading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  preloadNextImages: (currentIndex: number, count: number) => void;
}

// Create the context with default values
const ImagesContext = createContext<ImagesContextType>({
  images: [],
  loading: true,
  error: null,
  refreshImages: async () => {},
  preloadNextImages: () => {}
});

// Provider component that will wrap the app
export function ImagesProvider({ children }: { children: React.ReactNode }) {
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
        throw new Error('Failed to fetch images');
      }
      
      const data = await response.json();
      setImages(data.images || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching images:', err);
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

  return (
    <ImagesContext.Provider value={{ 
      images, 
      loading, 
      error, 
      refreshImages, 
      preloadNextImages 
    }}>
      {children}
    </ImagesContext.Provider>
  );
}

// Export the context for use in components
export default ImagesContext; 