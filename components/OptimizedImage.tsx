'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  className = '',
  onLoad,
  onError,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  loading = 'lazy',
  sizes,
  style
}: OptimizedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(blurDataURL || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldOptimize, setShouldOptimize] = useState(false);

  // Check if we should use client-side optimization
  useEffect(() => {
    // Only optimize if it's an R2 worker image and size is reasonable
    const shouldOpt = src.includes('r2-image-worker.aasim-ss.workers.dev') && 
                      width <= 800 && 
                      height <= 800 &&
                      'OffscreenCanvas' in window;
    setShouldOptimize(shouldOpt);
  }, [src, width, height]);

  const optimizeImage = useCallback(async () => {
    if (!shouldOptimize) {
      // Just load the image normally with optimization headers
      setOptimizedSrc(src);
      setIsLoading(false);
      return;
    }

    try {
      // Load original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            setOptimizedSrc(src);
            setIsLoading(false);
            return;
          }
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setOptimizedSrc(src);
            setIsLoading(false);
            return;
          }
          
          // Set canvas size to target dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Calculate scaling to maintain aspect ratio
          const scale = Math.min(width / img.width, height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          // Clear canvas and draw with optimization
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Fill background if needed
          if (img.width / img.height !== width / height) {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);
          }
          
          // Draw and resize image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Convert to optimized format
          const optimized = canvas.toDataURL('image/webp', quality / 100);
          setOptimizedSrc(optimized);
          setIsLoading(false);
          onLoad?.();
        } catch (canvasError) {
          console.warn('Canvas optimization failed:', canvasError);
          setOptimizedSrc(src);
          setIsLoading(false);
        }
      };
      
      img.onerror = () => {
        console.warn('Image load failed, using fallback');
        setHasError(true);
        setOptimizedSrc(src);
        setIsLoading(false);
        onError?.();
      };
      
      // Add optimization parameters to URL if R2 worker image
      const optimizedUrl = src.includes('r2-image-worker.aasim-ss.workers.dev') 
        ? `${src}${src.includes('?') ? '&' : '?'}w=${width}&h=${height}&q=${quality}&f=webp`
        : src;
      
      img.src = optimizedUrl;
    } catch (error) {
      console.error('Image optimization failed:', error);
      setOptimizedSrc(src);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  }, [src, width, height, quality, shouldOptimize, onLoad, onError]);

  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      optimizeImage();
    } else {
      // Use Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              optimizeImage();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      const imageElement = document.querySelector(`[data-src="${src}"]`);
      if (imageElement) {
        observer.observe(imageElement);
      } else {
        // Fallback - load after a short delay
        const timer = setTimeout(optimizeImage, 100);
        return () => clearTimeout(timer);
      }

      return () => observer.disconnect();
    }
  }, [optimizeImage, priority, src]);

  return (
    <>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Loading placeholder */}
      {isLoading && placeholder === 'blur' && (
        <div 
          className={`${className} optimized-image-loading`}
          style={{ 
            width, 
            height, 
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            ...style
          }}
          data-src={src}
        >
          {!blurDataURL && (
            <div style={{ 
              width: '24px', 
              height: '24px', 
              border: '2px solid #e9ecef',
              borderTop: '2px solid #6c757d',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>
      )}
      
      {/* Optimized image */}
      {!isLoading && optimizedSrc && (
        <img 
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} optimized-image-loaded`}
          loading={loading}
          decoding="async"
          sizes={sizes}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            ...style
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}
      
      {/* Add CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .optimized-image-loading {
          filter: blur(5px);
          transform: scale(1.02);
        }
        
        .optimized-image-loaded {
          filter: none;
          transform: scale(1);
        }
      `}</style>
    </>
  );
}

export default OptimizedImage;