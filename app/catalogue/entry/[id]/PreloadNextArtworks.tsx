'use client';

import { useEffect } from 'react';
import { useCloudinaryImages } from '../../../../context/CloudinaryContext';

interface PreloadNextArtworksProps {
  currentIndex: number;
  count?: number;
}

/**
 * A component that preloads the next artworks in the sequence.
 * This is a client component that uses the CloudinaryContext to preload images.
 */
export default function PreloadNextArtworks({ currentIndex, count = 3 }: PreloadNextArtworksProps) {
  const { preloadNextImages } = useCloudinaryImages();
  
  useEffect(() => {
    // Delay preloading slightly to prioritize current image
    const timer = setTimeout(() => {
      preloadNextImages(currentIndex, count);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, count, preloadNextImages]);
  
  // This component doesn't render anything visible
  return null;
} 