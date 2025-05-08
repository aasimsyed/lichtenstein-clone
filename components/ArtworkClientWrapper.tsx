'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BackButton from '../app/catalogue/entry/[id]/BackButton';
import ZoomableImage from '../app/catalogue/entry/[id]/ZoomableImage';
import { parseFilename } from '../app/utils/filename-utils';
import { useR2Images } from '../context/R2Context';
import '../app/styles/components.css';

// Client component that safely uses useSearchParams
export function ArtworkContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { images, loading } = useR2Images();

  if (!id) {
    return <div className="error-message">No artwork ID provided</div>;
  }

  // Try to find the image using different methods:
  // 1. Direct match with the image.id (string ID)
  // 2. If ID is numeric, try to find by index (1-based indexing)
  let selectedImage = images.find(img => img.id === id);
  
  // If not found and id is numeric, try to find by index
  if (!selectedImage && /^\d+$/.test(id)) {
    const numericId = parseInt(id, 10);
    // Arrays are 0-indexed, but our IDs are 1-indexed
    if (numericId > 0 && numericId <= images.length) {
      selectedImage = images[numericId - 1];
    }
  }
  
  // Only show "Artwork not found" error if we're not in a loading state
  if (!selectedImage && !loading) {
    return <div className="error-message">Artwork not found</div>;
  }

  // Show loading state if we're still loading and haven't found the image yet
  if (loading && !selectedImage) {
    return (
      <div className="loading-artwork">
        <div className="loading-artwork-container">
          <div className="loading-artwork-text">Loading artwork...</div>
          <div className="loading-artwork-spinner"></div>
        </div>
      </div>
    );
  }

  // If we're here, either we have the image or we're loading it
  // Parse artwork information from filename if we have an image
  const parsedInfo = selectedImage ? parseFilename(selectedImage.id) : { title: '', catalogNumber: '', size: '', artist: '' };

  return (
    <div className="entry-page-container">
      <BackButton />
      {selectedImage ? (
        <div className="entry-page-content">
          <h1 className="artwork-title">{parsedInfo.title || 'Untitled'}</h1>
          <div className="metadata">
            {parsedInfo.catalogNumber && <p><strong>Catalogue ID:</strong> {parsedInfo.catalogNumber}</p>}
            {parsedInfo.size && <p><strong>Size:</strong> {parsedInfo.size}mm</p>}
            {parsedInfo.artist && <p><strong>Artist:</strong> {parsedInfo.artist}</p>}
          </div>
          <div className="zoomable-image-container">
            <ZoomableImage 
              src={selectedImage.url} 
              alt={parsedInfo.title || 'Artwork Image'} 
              width={1000}
              height={1200}
            />
          </div>
        </div>
      ) : (
        <div className="loading-artwork">
          <div className="loading-artwork-container">
            <div className="loading-artwork-text">Loading artwork...</div>
            <div className="loading-artwork-spinner"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component wrapped in Suspense
export default function ArtworkClientWrapper() {
  return (
    <Suspense fallback={<div>Loading artwork...</div>}>
      <ArtworkContent />
    </Suspense>
  );
} 