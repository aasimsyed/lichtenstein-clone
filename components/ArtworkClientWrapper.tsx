'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BackButton from '../app/catalogue/entry/[id]/BackButton';
import ZoomableImage from '../app/catalogue/entry/[id]/ZoomableImage';
import { parseFilename } from '../app/utils/filename-utils';
import { useR2Images } from '../context/R2Context';
import { useAuth } from '../app/auth/useAuth';
import '../app/styles/components.css';

// Editable content section component
function EditableContentSection({ artworkId }: { artworkId: string }) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tempContent, setTempContent] = useState('');

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/artwork-content/${encodeURIComponent(artworkId)}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
      } else if (response.status !== 404) {
        console.error('Failed to load content:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [artworkId]);

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const startEditing = () => {
    setTempContent(content);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempContent('');
    setIsEditing(false);
  };

  const saveContent = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/artwork-content/${encodeURIComponent(artworkId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: tempContent }),
      });

      if (response.ok) {
        setContent(tempContent);
        setIsEditing(false);
        setTempContent('');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="artwork-content-section">
        <div className="content-loading">Loading additional information...</div>
      </div>
    );
  }

  return (
    <div className="artwork-content-section">
      <h3 className="content-section-title">Additional Information</h3>
      
      {isEditing ? (
        <div className="content-edit-mode">
          <textarea
            className="content-textarea"
            value={tempContent}
            onChange={(e) => setTempContent(e.target.value)}
            placeholder="Enter additional information about this artwork..."
            rows={6}
          />
          <div className="content-edit-buttons">
            <button 
              onClick={saveContent} 
              disabled={isSaving}
              className="content-save-button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={cancelEditing} 
              disabled={isSaving}
              className="content-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="content-display-mode">
          {content ? (
            <div className="content-text">
              {content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="content-empty">
              {isAuthenticated ? 'No additional information. Click "Edit" to add content.' : 'No additional information available.'}
            </div>
          )}
          
          {isAuthenticated && (
            <button 
              onClick={startEditing}
              className="content-edit-button"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
          <div className="artwork-info-sidebar">
            <h1 className="artwork-title">{parsedInfo.title || 'Untitled'}</h1>
            <div className="metadata">
              {parsedInfo.catalogNumber && <p><strong>Catalogue ID:</strong> {parsedInfo.catalogNumber}</p>}
              {parsedInfo.size && <p><strong>Size:</strong> {parsedInfo.size}mm</p>}
              {parsedInfo.artist && <p><strong>Artist:</strong> {parsedInfo.artist}</p>}
            </div>
            <EditableContentSection artworkId={selectedImage.id} />
          </div>
          <ZoomableImage 
            src={selectedImage.url} 
            alt={parsedInfo.title || 'Artwork Image'} 
            width={1000}
            height={1200}
          />
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