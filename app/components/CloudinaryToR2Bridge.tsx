'use client';

import React from 'react';
import R2Image from './R2Image';

// Define the props for the legacy Cloudinary component
interface CldImageProps {
  width: string | number;
  height: string | number;
  src?: string; // Some components might use src directly
  alt: string;
  crop?: string;
  gravity?: string;
  cloudName?: string;
  publicId?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  format?: string;
  placeholder?: string;
  onClick?: () => void;
}

/**
 * Bridge component that maps Cloudinary props to R2Image props
 * Use this for a gradual migration from Cloudinary to R2
 */
export default function CloudinaryToR2Bridge(props: CldImageProps) {
  const {
    width,
    height,
    src,
    alt,
    publicId,
    className,
    priority,
    sizes,
    quality,
    onClick,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cloudName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    crop,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gravity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    format,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    placeholder,
    ...rest
  } = props;

  // Convert width/height to numbers
  const widthNum = typeof width === 'string' ? parseInt(width, 10) : width;
  const heightNum = typeof height === 'string' ? parseInt(height, 10) : height;

  // Determine the source URL - either directly provided or constructed from publicId
  const imageUrl = src || (publicId ? `https://r2-image-worker.aasim-ss.workers.dev/${publicId}.jpg` : '');

  if (!imageUrl) {
    console.error('CloudinaryToR2Bridge: No image source provided!');
    return null;
  }

  return (
    <R2Image
      src={imageUrl}
      alt={alt}
      width={widthNum}
      height={heightNum}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      onClick={onClick}
      {...rest}
    />
  );
}

// For syntax compatibility
export const CldImage = CloudinaryToR2Bridge; 