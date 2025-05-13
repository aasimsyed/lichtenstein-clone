'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [deleteStatus, setDeleteStatus] = useState({ success: null, message: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://r2-image-worker.aasim-ss.workers.dev/?list=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText} (${response.status})`);
      }
      
      const data = await response.json();
      
      // Sort images by date, newest first
      const sortedImages = data.objects.sort((a, b) => {
        return new Date(b.uploaded) - new Date(a.uploaded);
      });
      
      setImages(sortedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = useMemo(() => {
    if (!searchTerm) {
      return images;
    }
    return images.filter(image => 
      image.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  const toggleImageSelection = (key) => {
    setSelectedImages(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const selectAll = () => {
    if (selectedImages.length === filteredImages.length && filteredImages.length > 0) {
      // Deselect all if all filtered images are selected
      setSelectedImages([]);
    } else {
      // Select all filtered images
      setSelectedImages(filteredImages.map(img => img.key));
    }
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}?`)) {
      return;
    }
    
    setDeleteStatus({ success: null, message: '' });
    
    try {
      const response = await fetch('https://r2-image-worker.aasim-ss.workers.dev/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: selectedImages }),
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDeleteStatus({ 
          success: true, 
          message: `Successfully deleted ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`
        });
        
        // Refresh the image list
        fetchImages();
        
        // Clear selection
        setSelectedImages([]);
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting images:', error);
      setDeleteStatus({ 
        success: false, 
        message: `Failed to delete images: ${error.message}`
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-images-section">
      <div className="admin-images-header">
        <h2>Image Gallery</h2>
        
        <div className="admin-images-actions">
          <input 
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', marginRight: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            className="admin-action-button"
            onClick={fetchImages}
            disabled={loading}
          >
            Refresh
          </button>
          
          <button
            className="admin-action-button"
            onClick={selectAll}
            disabled={loading || filteredImages.length === 0}
          >
            {selectedImages.length === filteredImages.length && filteredImages.length > 0 
              ? 'Deselect All' 
              : 'Select All'
            }
          </button>
          
          <button
            className="admin-action-button delete-button"
            onClick={deleteSelectedImages}
            disabled={loading || selectedImages.length === 0}
          >
            Delete Selected ({selectedImages.length})
          </button>
        </div>
      </div>
      
      {/* Delete status message */}
      {deleteStatus.success === true && (
        <div className="delete-success">{deleteStatus.message}</div>
      )}
      
      {deleteStatus.success === false && (
        <div className="delete-error">{deleteStatus.message}</div>
      )}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div style={{
            border: '4px solid #f3f4f6',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            animation: 'spin 1s linear infinite',
          }}></div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="no-images-message">
          {searchTerm ? 'No images match your search.' : 'No images found. Upload some images to get started.'}
        </div>
      ) : (
        <div className="admin-images-grid">
          {filteredImages.map(image => (
            <div 
              key={image.key}
              className={`admin-image-card ${selectedImages.includes(image.key) ? 'selected' : ''}`}
              onClick={() => toggleImageSelection(image.key)}
            >
              <div className="admin-image-selection">
                <input 
                  type="checkbox" 
                  checked={selectedImages.includes(image.key)}
                  onChange={() => {}} // Controlled component
                />
              </div>
              
              <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                <Image
                  src={`https://r2-image-worker.aasim-ss.workers.dev/${image.key}`}
                  alt={image.key}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="admin-image-thumbnail"
                  sizes="(max-width: 768px) 100vw, 180px"
                />
              </div>
              
              <div className="admin-image-info">
                <h4 className="admin-image-name">{image.key}</h4>
                <p className="admin-image-date">{formatDate(image.uploaded)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 