'use client';

import React, { useState, useRef } from 'react';
import SmoothImage from '../../../components/SmoothImage';

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
  const [zoomLevel, setZoomLevel] = useState(0.75); // Initial zoom level (75%)
  
  // Refs for pinch-to-zoom
  const touchStartRef = useRef<{ x: number, y: number, distance: number | null }>({
    x: 0,
    y: 0,
    distance: null
  });
  
  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = ''; // Re-enable scrolling
    // Reset position and zoom when closing
    setPosition({ x: 0, y: 0 });
    setZoomLevel(0.75);
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
  
  // Calculate distance between two touch points
  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Get midpoint between two touch points
  const getMidpoint = (touches: React.TouchList): { x: number, y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - dragging
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
      
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        distance: null
      };
    } else if (e.touches.length === 2) {
      // Two touches - pinching
      e.preventDefault();
      const distance = getDistance(e.touches);
      const midpoint = getMidpoint(e.touches);
      
      touchStartRef.current = {
        x: midpoint.x,
        y: midpoint.y,
        distance: distance
      };
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent page scrolling
    
    if (e.touches.length === 1 && isDragging) {
      // Single touch - dragging
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartRef.current.distance !== null) {
      // Two touches - pinching
      const currentDistance = getDistance(e.touches);
      const initialDistance = touchStartRef.current.distance;
      
      // Calculate new zoom based on pinch gesture
      const scaleFactor = currentDistance / initialDistance;
      const newZoom = Math.min(Math.max(zoomLevel * scaleFactor, 0.5), 8);
      
      // Update the zoom level
      if (newZoom >= 0.5 && newZoom <= 8) {
        setZoomLevel(newZoom);
        
        // Update midpoint position for smoother zooming
        const midpoint = getMidpoint(e.touches);
        setDragStart({
          x: midpoint.x - position.x,
          y: midpoint.y - position.y
        });
      }
      
      // Update touch reference for next move event
      touchStartRef.current = {
        x: getMidpoint(e.touches).x,
        y: getMidpoint(e.touches).y,
        distance: currentDistance
      };
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
    if (zoomLevel > 0.5) { // Minimum zoom level of 50%
      setZoomLevel(prevLevel => prevLevel - 0.5);
    }
  };
  
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(0.75);
  };
  
  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0 && zoomLevel < 8) {
      // Zoom in (wheel up)
      setZoomLevel(prevLevel => Math.min(prevLevel + 0.25, 8));
    } else if (e.deltaY > 0 && zoomLevel > 0.5) {
      // Zoom out (wheel down)
      setZoomLevel(prevLevel => Math.max(prevLevel - 0.25, 0.5));
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
            objectFit: 'contain', margin: 'auto', display: 'block',
            cursor: 'zoom-in'
          }}
        />
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
              <SmoothImage 
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
                  maxHeight: 'none',
                  objectFit: 'contain', margin: 'auto', display: 'block'
                }}
                priority
                quality={95}
                unoptimized={false}
              />
            </div>
            
            <div className="image-modal-controls">
              <button onClick={handleZoomOut} className="image-modal-button" disabled={zoomLevel <= 0.5}>−</button>
              <div className="image-modal-zoom-level">{Math.round(zoomLevel * 100)}%</div>
              <button onClick={handleZoomIn} className="image-modal-button" disabled={zoomLevel >= 8}>+</button>
              <button onClick={handleReset} className="image-modal-button reset">Reset</button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
} 