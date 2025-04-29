'use client';

import { useEffect } from 'react';
import { useR2Images } from '../../../../context/R2Context';

interface PreloadNextArtworksProps {
  currentIndex: number;
  count?: number;
}

/**
 * A component that preloads the next artworks in the sequence.
 * This is a client component that uses the R2Context to preload images.
 */
export default function PreloadNextArtworks({ currentIndex, count = 3 }: PreloadNextArtworksProps) {
  const { preloadNextImages } = useR2Images();
  
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