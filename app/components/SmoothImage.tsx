'use client';

import React, { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import NextImage, { ImageProps } from 'next/image';
import { useInView } from 'react-intersection-observer';
import { useR2Images } from '../../context/R2Context';

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
  fadeIn?: boolean; // Control whether to use fade-in effect
  preventRerender?: boolean; // New prop to prevent re-renders
}

// Interface for handling Next.js StaticImageData
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

// Type for image source
type ImageSource = string | StaticImageData;

// Cache for preloaded images - moved to module level for better persistence
const imageCache = new Map<string, boolean>();

const SmoothImage = forwardRef<HTMLImageElement, SmoothImageProps>((props, forwardedRef) => {
  const { isImageReady } = useR2Images();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const internalImageRef = useRef<HTMLImageElement>(null);
  const prevSrcRef = useRef<string | null>(null);
  const renderAttempts = useRef<number>(0);
  
  // Combine refs - use forwardedRef if provided, otherwise use internalImageRef
  const imageRef = forwardedRef || internalImageRef;
  
  const { 
    loadingColor = '#f0f0f0', 
    transitionDuration = 0.4, // Slightly longer for smoother transition
    transitionTiming = 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design transition for smoothness
    placeholder = 'blur',
    blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    preload = false,
    cacheKey,
    lazyBoundary = '300px', // Increased boundary for earlier loading
    quality = 85, // Default quality setting
    unoptimized = true, // Default to true for static export compatibility
    fadeIn = true, // Enable fade-in by default
    preventRerender = true, // Default to preventing re-renders
    ...imageProps 
  } = props;

  // Check if source is a data URI
  const isDataUri = typeof props.src === 'string' && props.src.startsWith('data:');
  
  // If the image is a data URI, we need to use the unoptimized prop
  const shouldUseUnoptimized = unoptimized || isDataUri;

  // Use IntersectionObserver for smarter loading with a larger root margin
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: lazyBoundary,
    threshold: 0.1,
  });

  // Get src string from either string or StaticImageData
  const getSrcString = useCallback((source: ImageSource): string => {
    if (typeof source === 'string') {
      return source;
    }
    return source.src;
  }, []);

  // Create a derived cacheKey and memoize it to prevent recalculation
  const derivedCacheKey = useMemo(() => cacheKey || getSrcString(props.src as ImageSource), [cacheKey, props.src, getSrcString]);

  // Check if image is already in cache on mount - use both local and R2 cache
  useEffect(() => {
    // Skip this if we're already loaded
    if (isLoaded && prevSrcRef.current === getSrcString(props.src as ImageSource)) {
      return;
    }
    
    const currentSrc = getSrcString(props.src as ImageSource);
    
    // Check both local image cache and R2 context cache
    const isReadyInCache = imageCache.has(derivedCacheKey) || isImageReady(currentSrc);
    
    if (isReadyInCache) {
      setIsLoaded(true);
    }
    
    // Set initial reference for src
    prevSrcRef.current = currentSrc;
      
    // Mark as rendered
    setHasRendered(true);
  }, [derivedCacheKey, props.src, getSrcString, isImageReady, isLoaded]);

  // Only reset if source changes - prevents re-rendering the same image
  useEffect(() => {
    const currentSrc = getSrcString(props.src as ImageSource);
      
    if (prevSrcRef.current && prevSrcRef.current !== currentSrc) {
      // Only reset loading state if the image actually changed
      setIsLoaded(imageCache.has(derivedCacheKey) || isImageReady(currentSrc));
      prevSrcRef.current = currentSrc;
    }
  }, [props.src, derivedCacheKey, getSrcString, isImageReady]);

  // Handle preloading and tracking when image is in view
  useEffect(() => {
    if ((preload || inView) && !isLoaded && !imageCache.has(derivedCacheKey)) {
      // Mark image as rendering to prevent duplicate loads
      if (isRendering) return;
      
      setIsRendering(true);
      
      // Create a new Image object to preload
      const img = new Image();
      const imageSrc = getSrcString(props.src as ImageSource);
      
      img.onload = () => {
        imageCache.set(derivedCacheKey, true);
        setIsLoaded(true);
        setIsRendering(false);
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${imageSrc}`);
        setIsRendering(false);
        // Retry a limited number of times
        if (renderAttempts.current < 2) {
          renderAttempts.current += 1;
          setTimeout(() => {
            setIsRendering(false);
          }, 200);
        } else {
          setIsError(true);
        }
      };
      
      img.src = imageSrc;
      img.loading = 'eager';
    }
    
    // Track when image is in view
    if (inView && !isIntersecting) {
      setIsIntersecting(true);
    }
  }, [preload, props.src, derivedCacheKey, inView, isIntersecting, isLoaded, getSrcString, isRendering]);

  // Handle image load - use callback to prevent closure issues
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    setIsRendering(false);
    
    // Update cache
    if (derivedCacheKey) {
      imageCache.set(derivedCacheKey, true);
    }
    
    if (props.onLoadingComplete) {
      props.onLoadingComplete(event.currentTarget);
    }
  }, [props.onLoadingComplete, derivedCacheKey]);

  // Memoize container style for better performance
  const containerStyle = useMemo(() => ({
    position: 'relative' as const,
    overflow: 'hidden' as const,
    backgroundColor: isLoaded ? 'transparent' : loadingColor,
    width: '100%',
    height: '100%',
    display: 'block' as const,
    contain: 'paint' as const, // Use CSS containment for better performance
    willChange: 'contents' as const, // Hint to browser about what will change
  }), [isLoaded, loadingColor]);

  // Memoize image style for better performance
  const imageStyle = useMemo(() => ({
    opacity: (isLoaded || !fadeIn) ? 1 : 0,
    transition: fadeIn ? `opacity ${transitionDuration}s ${transitionTiming}` : 'none',
    objectFit: ((props.style as React.CSSProperties)?.objectFit as React.CSSProperties['objectFit']) || 'cover',
    width: '100%',
    height: '100%',
    WebkitTapHighlightColor: 'transparent',
    transform: 'translateZ(0)', // Hardware acceleration
    willChange: fadeIn ? 'opacity' : 'auto', // Only use willChange when necessary
    backfaceVisibility: 'hidden' as const, // Prevent flickering in some browsers
    contain: 'paint' as const, // Use CSS containment for better performance
    ...((props.style as React.CSSProperties) || {}),
  }), [isLoaded, fadeIn, transitionDuration, transitionTiming, props.style]);

  // Create an error UI for when images fail to load
  if (isError) {
    return (
      <div 
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
          fontSize: '14px',
          textAlign: 'center',
          padding: '10px',
          ...((props.style as React.CSSProperties) || {}),
        }}
      >
        Image not available
      </div>
    );
  }

  // For data URIs, we use a standard img tag
  if (isDataUri) {
    return (
      <div style={containerStyle} ref={ref}>
        {(isIntersecting || preload) && (
          <img 
            src={props.src as string}
            alt={props.alt}
            style={{
              ...imageStyle,
              opacity: 1, // Data URIs load immediately
            }}
            width={props.width}
            height={props.height}
            onLoad={handleImageLoad}
            onError={() => setIsError(true)}
            ref={imageRef as React.RefObject<HTMLImageElement>}
          />
        )}
      </div>
    );
  }

  // If image has already been rendered and we're preventing re-renders
  if (preventRerender && hasRendered && isLoaded) {
    return (
      <div style={containerStyle} ref={ref}>
        <NextImage 
          {...imageProps}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={{...imageStyle, opacity: 1}} // Force opacity 1 for already loaded images
          quality={quality}
          priority={preload}
          unoptimized={shouldUseUnoptimized}
          fetchPriority={preload ? "high" : "auto"}
          ref={imageRef as React.RefObject<HTMLImageElement>}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle} ref={ref}>
      {(isIntersecting || preload || hasRendered) && (
        <NextImage 
          {...imageProps}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={imageStyle}
          quality={quality}
          priority={preload}
          unoptimized={shouldUseUnoptimized}
          fetchPriority={preload ? "high" : "auto"}
          ref={imageRef as React.RefObject<HTMLImageElement>}
          onLoad={handleImageLoad}
          onError={() => {
            console.error(`Failed to load image: ${getSrcString(props.src as ImageSource)}`);
            setIsError(true);
          }}
        />
      )}
    </div>
  );
});

// Add display name for debugging
SmoothImage.displayName = 'SmoothImage';

export default SmoothImage; 