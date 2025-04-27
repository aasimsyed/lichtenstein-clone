'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CloudinaryImage } from '../app/utils/cloudinary-utils';

// Define the context type
interface CloudinaryContextType {
  images: CloudinaryImage[];
  loading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  preloadNextImages: (currentIndex: number, count: number) => void;
}

// Create the context with default values
const CloudinaryContext = createContext<CloudinaryContextType>({
  images: [],
  loading: true,
  error: null,
  refreshImages: async () => {},
  preloadNextImages: () => {}
});

// Provider component that will wrap the app
export function CloudinaryProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
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
      const response = await fetch(`/api/cloudinary?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Cloudinary images');
      }
      
      const data = await response.json();
      setImages(data.images || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Cloudinary images:', err);
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
    <CloudinaryContext.Provider value={value}>
      {children}
    </CloudinaryContext.Provider>
  );
}

// Custom hook for using the Cloudinary context
export function useCloudinaryImages() {
  const context = useContext(CloudinaryContext);
  
  if (context === undefined) {
    throw new Error('useCloudinaryImages must be used within a CloudinaryProvider');
  }
  
  return context;
} 