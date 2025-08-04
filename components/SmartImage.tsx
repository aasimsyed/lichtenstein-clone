'use client';

import React, { useState, useRef, useEffect } from 'react';
import useOptimizedImage from '../hooks/useOptimizedImage';

interface SmartImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  showCompressionStats?: boolean;
  useWebWorker?: boolean;
  fadeIn?: boolean;
  preventRerender?: boolean;
}

export function SmartImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  className = '',
  style,
  priority = false,
  loading = 'lazy',
  sizes,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  showCompressionStats = false,
  useWebWorker = true,
  fadeIn = true,
  preventRerender = false
}: SmartImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Use the optimization hook
  const { 
    src: optimizedSrc, 
    isLoading, 
    error, 
    compressionStats 
  } = useOptimizedImage(src, {
    width,
    height,
    quality,
    priority: isVisible && priority,
    useWebWorker
  });

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isVisible]);

  // Handle load completion
  useEffect(() => {
    if (optimizedSrc && !isLoading) {
      setHasLoaded(true);
      onLoad?.();
    }
  }, [optimizedSrc, isLoading, onLoad]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    overflow: 'hidden',
    backgroundColor: placeholder === 'blur' ? '#f8f9fa' : 'transparent',
    ...style
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    transition: fadeIn ? 'opacity 0.3s ease-in-out' : 'none',
    opacity: hasLoaded ? 1 : 0
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: blurDataURL ? `url(${blurDataURL})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(5px)',
    transform: 'scale(1.02)',
    opacity: hasLoaded ? 0 : 1,
    transition: fadeIn ? 'opacity 0.3s ease-in-out' : 'none'
  };

  return (
    <div 
      ref={elementRef}
      className={`smart-image-container ${className}`}
      style={containerStyle}
      onMouseEnter={() => showCompressionStats && setShowStats(true)}
      onMouseLeave={() => setShowStats(false)}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && (
        <div style={placeholderStyle}>
          {!blurDataURL && isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              border: '2px solid #e9ecef',
              borderTop: '2px solid #6c757d',
              borderRadius: '50%',
              animation: 'smart-image-spin 1s linear infinite'
            }} />
          )}
        </div>
      )}

      {/* Optimized Image */}
      {isVisible && optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          style={imageStyle}
          loading={loading}
          decoding="async"
          sizes={sizes}
          onError={() => onError?.(error || 'Image load failed')}
        />
      )}

      {/* Compression Stats Overlay */}
      {showCompressionStats && compressionStats && showStats && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 10
        }}>
          {compressionStats.compressionRatio}% smaller
        </div>
      )}

      {/* Error State */}
      {error && !optimizedSrc && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#dc3545',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ Failed to load
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes smart-image-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SmartImage;