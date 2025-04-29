'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getOptimizedImageUrl, getBestImageFormat } from '../utils/r2-client';

interface R2ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onClick?: () => void;
}

export default function R2Image({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  quality = 80,
  sizes = '(max-width: 768px) 100vw, 800px',
  onClick,
}: R2ImageProps) {
  const [imageError, setImageError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState('');
  
  useEffect(() => {
    // Generate optimized URL for the image from R2
    const bestFormat = getBestImageFormat();
    
    try {
      const optimized = getOptimizedImageUrl(src, {
        width,
        quality,
        format: bestFormat,
      });
      
      setOptimizedSrc(optimized);
    } catch (error) {
      console.error('Error optimizing image:', error);
      setOptimizedSrc(src); // Fallback to original source
    }
  }, [src, width, quality]);
  
  // If no optimized source yet, show a placeholder
  if (!optimizedSrc) {
    return (
      <div 
        className={`bg-gray-200 ${className}`} 
        style={{ width: width || '100%', height: height || 'auto' }}
      />
    );
  }
  
  // If there was an error loading the image, show a fallback
  if (imageError) {
    return (
      <div 
        className={`bg-gray-300 flex items-center justify-center text-gray-500 ${className}`}
        style={{ width: width || '100%', height: height || 'auto' }}
        onClick={onClick}
      >
        <span>Image not available</span>
      </div>
    );
  }
  
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onError={() => setImageError(true)}
      onClick={onClick}
    />
  );
} 