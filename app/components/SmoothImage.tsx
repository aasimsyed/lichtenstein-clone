'use client';

import React, { useState, useEffect, useRef } from 'react';
import NextImage, { ImageProps } from 'next/image';
import { useInView } from 'react-intersection-observer';

interface SmoothImageProps extends Omit<ImageProps, 'placeholder'> {
  // Any additional props can be added here
  loadingColor?: string;
  transitionDuration?: number;
  transitionTiming?: string;
  placeholder?: 'blur' | 'empty' | undefined;
  blurDataURL?: string;
  preload?: boolean; // New prop to enable preloading
  cacheKey?: string; // New prop for explicit cache control
  lazyBoundary?: string; // Customize lazy loading boundary
  quality?: number; // Image quality control
  unoptimized?: boolean; // For already optimized images
}

// Cache for preloaded images
const imageCache = new Map<string, boolean>();

export default function SmoothImage(props: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const { 
    loadingColor = '#f0f0f0', 
    transitionDuration = 0.3, // Slightly faster transition
    transitionTiming = 'ease-out', // Changed to ease-out for faster perceived performance
    placeholder = 'blur',
    blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    preload = false,
    cacheKey,
    lazyBoundary = '200px',
    quality = 85, // Default quality setting
    unoptimized = false,
    ...imageProps 
  } = props;

  // Use IntersectionObserver for smarter loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: lazyBoundary,
    threshold: 0.1,
  });

  // Handle preloading
  useEffect(() => {
    if (preload && typeof props.src === 'string') {
      const cacheKeyToUse = cacheKey || props.src;
      
      // Only preload if not already in cache
      if (!imageCache.has(cacheKeyToUse)) {
        // Create a new Image object to preload
        const img = new Image();
        
        img.onload = () => {
          imageCache.set(cacheKeyToUse, true);
        };
        
        img.src = props.src;
        
        // Add loading=eager hint for browser
        img.loading = 'eager';
      }
    }
    
    // Track when image is in view
    if (inView && !isIntersecting) {
      setIsIntersecting(true);
    }
  }, [preload, props.src, cacheKey, inView, isIntersecting]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: isLoaded ? 'transparent' : loadingColor,
    width: '100%',
    height: '100%',
    display: 'block',
  };

  const imageStyle: React.CSSProperties = {
    opacity: isLoaded ? 1 : 0,
    transition: `opacity ${transitionDuration}s ${transitionTiming}`,
    objectFit: ((props.style as React.CSSProperties)?.objectFit as React.CSSProperties['objectFit']) || 'cover',
    width: '100%',
    height: '100%',
    ...((props.style as React.CSSProperties) || {}),
  };

  return (
    <div style={containerStyle} ref={ref}>
      {(isIntersecting || preload) && (
        <NextImage 
          {...imageProps}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={imageStyle}
          quality={quality}
          priority={preload}
          unoptimized={unoptimized}
          fetchPriority={preload ? "high" : "auto"}
          ref={imageRef}
          onLoadingComplete={(result) => {
            // No delay for faster perception
            setIsLoaded(true);
            
            // Update cache
            if (cacheKey && typeof props.src === 'string') {
              imageCache.set(cacheKey, true);
            }
            
            if (props.onLoadingComplete) {
              props.onLoadingComplete(result);
            }
          }}
        />
      )}
    </div>
  );
} 