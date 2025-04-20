'use client';

import React, { useState } from 'react';
import NextImage, { ImageProps } from 'next/image';

interface SmoothImageProps extends Omit<ImageProps, 'placeholder'> {
  // Any additional props can be added here
  loadingColor?: string;
  transitionDuration?: number;
  transitionTiming?: string;
  placeholder?: 'blur' | 'empty' | undefined;
  blurDataURL?: string;
}

export default function SmoothImage(props: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { 
    loadingColor = '#f0f0f0', 
    transitionDuration = 0.4,
    transitionTiming = 'ease-in-out',
    placeholder = 'blur',
    blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    ...imageProps 
  } = props;

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
    <div style={containerStyle}>
      <NextImage 
        {...imageProps}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        style={imageStyle}
        onLoadingComplete={(result) => {
          // Add a small delay to make the transition more noticeable
          setTimeout(() => {
            setIsLoaded(true);
          }, 50);
          
          if (props.onLoadingComplete) {
            props.onLoadingComplete(result);
          }
        }}
      />
    </div>
  );
} 