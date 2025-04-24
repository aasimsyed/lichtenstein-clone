'use client';

import React, { useState } from 'react';
import SmoothImage from '../../../components/SmoothImage';
import Image from 'next/image';

interface ZoomableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function ZoomableImage({ src, alt, width, height }: ZoomableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(2); // Initial zoom level (2x)
  
  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = ''; // Re-enable scrolling
    // Reset position and zoom when closing
    setPosition({ x: 0, y: 0 });
    setZoomLevel(2);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
      e.preventDefault(); // Prevent page scrolling while dragging
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => {
    if (zoomLevel < 8) { // Maximum zoom level increased to 8x (800%)
      setZoomLevel(prevLevel => prevLevel + 0.5);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 1) { // Minimum zoom level
      setZoomLevel(prevLevel => prevLevel - 0.5);
    }
  };
  
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(2);
  };
  
  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0 && zoomLevel < 8) {
      // Zoom in (wheel up)
      setZoomLevel(prevLevel => Math.min(prevLevel + 0.25, 8));
    } else if (e.deltaY > 0 && zoomLevel > 1) {
      // Zoom out (wheel down)
      setZoomLevel(prevLevel => Math.max(prevLevel - 0.25, 1));
    }
  };
  
  // Generate unique cache key for this image
  const cacheKey = `artwork-${src.split('/').pop()}`;
  
  return (
    <>
      {/* Regular image that opens modal when clicked */}
      <div className="zoomable-image-container" onClick={openModal}>
        <SmoothImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="entryMainImage"
          priority
          preload={true}
          cacheKey={cacheKey}
          quality={90}
          lazyBoundary="300px"
          placeholder="blur"
          style={{
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'zoom-in'
          }}
        />
        <div className="zoom-hint">
          <span className="zoom-icon">🔍</span> Click to Zoom
        </div>
      </div>
      
      {/* Modal for zoomed image */}
      {isModalOpen && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeModal}>×</button>
            
            <div 
              className="image-modal-image-container"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <Image 
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="image-modal-image"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transformOrigin: 'center',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                priority
                quality={95}
                unoptimized={false}
              />
            </div>
            
            <div className="image-modal-controls">
              <button onClick={handleZoomOut} className="image-modal-button" disabled={zoomLevel <= 1}>−</button>
              <div className="image-modal-zoom-level">{Math.round(zoomLevel * 100)}%</div>
              <button onClick={handleZoomIn} className="image-modal-button" disabled={zoomLevel >= 8}>+</button>
              <button onClick={handleReset} className="image-modal-button reset">Reset</button>
            </div>
            
            <div className="image-modal-instructions">
              Click and drag to move the image • Use mouse wheel to zoom
            </div>
          </div>
        </div>
      )}
    </>
  );
} 