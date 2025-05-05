'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BackButton from '../app/catalogue/entry/[id]/BackButton';
import ZoomableImage from '../app/catalogue/entry/[id]/ZoomableImage';
import { parseFilename } from '../app/utils/filename-utils';
import { useR2Images } from '../context/R2Context';

// Client component that safely uses useSearchParams
export function ArtworkContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { images } = useR2Images();

  if (!id) {
    return <div className="error-message">No artwork ID provided</div>;
  }

  // Find the image based on ID
  const selectedImage = images.find(img => img.id === id);
  
  if (!selectedImage) {
    return <div className="error-message">Artwork not found</div>;
  }

  // Parse artwork information from filename
  const parsedInfo = parseFilename(selectedImage.id);

  return (
    <div className="entry-page-container">
      <BackButton />
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