'use client';

import React, { useState, useRef, useEffect } from 'react';
import SmoothImage from '../../../components/SmoothImage';

interface ZoomableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function ZoomableImage({ src, alt, width, height }: ZoomableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Use state only for UI display, actual values are in refs for smoother updates
  const [zoomLevel, setZoomLevel] = useState(0.75); // Initial zoom level (75%)
  
  // Refs for better performance
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const zoomLevelRef = useRef(0.75);
  const isDraggingRef = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for pinch-to-zoom
  const touchStartRef = useRef<{ x: number, y: number, distance: number | null }>({
    x: 0,
    y: 0,
    distance: null
  });
  
  // Keep refs in sync with state when state changes
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  
  // Apply initial transform and setup
  useEffect(() => {
    if (imageRef.current) {
      // Set initial transform
      applyTransform();
    }
  }, [isModalOpen]);
  
  // Helper function to apply transform without triggering unnecessary reflows
  const applyTransform = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) scale(${zoomLevelRef.current})`;
    }
  };
  
  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    
    // Reset position and zoom
    positionRef.current = { x: 0, y: 0 };
    zoomLevelRef.current = 0.75;
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = ''; // Re-enable scrolling
    
    // Reset position and zoom when closing
    positionRef.current = { x: 0, y: 0 };
    zoomLevelRef.current = 0.75;
    setZoomLevel(0.75); // This state is only used for UI display
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Store the drag start position
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    };
    
    // Use ref for dragging state to avoid re-renders
    isDraggingRef.current = true;
    
    // Apply dragging styles directly to the element
    if (imageRef.current) {
      // Apply CSS class for cursor change - avoid classList which can cause reflow
      imageRef.current.style.cursor = 'grabbing';
      
      // Completely disable transitions during drag
      imageRef.current.style.transition = 'none';
      
      // Ensure hardware acceleration is enabled
      imageRef.current.style.willChange = 'transform';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    // Calculate new position
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Update position ref directly
    positionRef.current = { x: newX, y: newY };
    
    // Apply transform directly - no state updates or requestAnimationFrame
    applyTransform();
  };
  
  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    
    // Update ref first
    isDraggingRef.current = false;
    
    // Remove dragging styles
    if (imageRef.current) {
      // Restore cursor style
      imageRef.current.style.cursor = 'grab';
      
      // Re-enable transitions, but only after a brief delay
      setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.style.transition = 'transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)';
          imageRef.current.style.willChange = 'auto';
        }
      }, 50);
    }
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
      e.preventDefault();
      
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - positionRef.current.x,
        y: touch.clientY - positionRef.current.y
      };
      
      // Apply dragging styles directly to the element - same as mouse handlers
      if (imageRef.current) {
        imageRef.current.classList.add('dragging');
        imageRef.current.style.transition = 'none';
        imageRef.current.style.willChange = 'transform';
      }
      
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        distance: null
      };
      
      // Set state after DOM manipulations
      isDraggingRef.current = true;
    } else if (e.touches.length === 2) {
      // Two touches - pinching
      e.preventDefault();
      
      // Disable transitions during pinch zoom
      if (imageRef.current) {
        imageRef.current.style.transition = 'none';
        imageRef.current.style.willChange = 'transform';
      }
      
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
    
    if (e.touches.length === 1 && isDraggingRef.current) {
      // Single touch - dragging
      const touch = e.touches[0];
      
      // Calculate new position
      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;
      
      // Update position ref directly
      positionRef.current = { x: newX, y: newY };
      
      // Apply transform directly - no requestAnimationFrame to avoid timing issues
      if (imageRef.current) {
        imageRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale(${zoomLevel})`;
      }
    } else if (e.touches.length === 2 && touchStartRef.current.distance !== null) {
      // Two touches - pinching
      const currentDistance = getDistance(e.touches);
      const initialDistance = touchStartRef.current.distance;
      
      // Calculate new zoom based on pinch gesture
      const scaleFactor = currentDistance / initialDistance;
      const newZoom = Math.min(Math.max(zoomLevel * scaleFactor, 0.5), 8);
      
      // Update the zoom level
      if (newZoom >= 0.5 && newZoom <= 8) {
        // Apply zoom directly to DOM for immediate feedback
        if (imageRef.current) {
          imageRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) scale(${newZoom})`;
        }
        
        // Update midpoint position for smoother zooming
        const midpoint = getMidpoint(e.touches);
        dragStartRef.current = {
          x: midpoint.x - positionRef.current.x,
          y: midpoint.y - positionRef.current.y
        };
      }
      
      // Update touch reference for next move event
      touchStartRef.current = {
        x: getMidpoint(e.touches).x,
        y: getMidpoint(e.touches).y,
        distance: currentDistance
      };
      
      // Update zoom level with slight delay
      if (newZoom >= 0.5 && newZoom <= 8) {
        setZoomLevel(newZoom);
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDraggingRef.current && touchStartRef.current.distance === null) return;
    
    // Remove dragging class and re-enable transitions
    if (imageRef.current) {
      imageRef.current.classList.remove('dragging');
      imageRef.current.style.transition = 'transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)';
      imageRef.current.style.willChange = 'auto';
    }
    
    // Reset touch distance
    touchStartRef.current.distance = null;
    
    // Update position state to match the current drag position
    positionRef.current = { x: 0, y: 0 };
    
    // Set dragging state to false after other operations
    isDraggingRef.current = false;
  };
  
  const handleZoomIn = () => {
    if (zoomLevelRef.current < 8) {
      // Calculate new zoom
      const newZoom = Math.min(zoomLevelRef.current + 0.5, 8);
      
      // Update ref first
      zoomLevelRef.current = newZoom;
      
      // Apply transform directly
      applyTransform();
      
      // Update state only after transform is applied
      // Delay state update to avoid flicker
      setTimeout(() => {
        setZoomLevel(newZoom);
      }, 50);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevelRef.current > 0.5) {
      // Calculate new zoom
      const newZoom = Math.max(zoomLevelRef.current - 0.5, 0.5);
      
      // Update ref first
      zoomLevelRef.current = newZoom;
      
      // Apply transform directly
      applyTransform();
      
      // Update state only after transform is applied
      // Delay state update to avoid flicker
      setTimeout(() => {
        setZoomLevel(newZoom);
      }, 50);
    }
  };
  
  const handleReset = () => {
    // Update refs first
    positionRef.current = { x: 0, y: 0 };
    zoomLevelRef.current = 0.75;
    
    // Apply transform directly
    applyTransform();
    
    // Update state only after transform is applied
    // Delay state update to avoid flicker
    setTimeout(() => {
      setZoomLevel(0.75);
    }, 50);
  };
  
  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    let newZoom = zoomLevelRef.current;
    
    if (e.deltaY < 0 && zoomLevelRef.current < 8) {
      // Zoom in (wheel up)
      newZoom = Math.min(zoomLevelRef.current + 0.25, 8);
    } else if (e.deltaY > 0 && zoomLevelRef.current > 0.5) {
      // Zoom out (wheel down)
      newZoom = Math.max(zoomLevelRef.current - 0.25, 0.5);
    } else {
      // No change needed
      return;
    }
    
    // Update ref first
    zoomLevelRef.current = newZoom;
    
    // Apply transform directly
    applyTransform();
    
    // Update state only after transform is applied
    // Delay state update to avoid flicker
    setTimeout(() => {
      setZoomLevel(newZoom);
    }, 50);
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
              ref={containerRef}
            >
              <SmoothImage 
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="image-modal-image"
                style={{
                  transformOrigin: 'center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  objectFit: 'contain', 
                  margin: 'auto', 
                  display: 'block',
                  cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  willChange: isDraggingRef.current ? 'transform' : 'auto',
                } as React.CSSProperties}
                priority
                quality={95}
                unoptimized={true}
                ref={imageRef}
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