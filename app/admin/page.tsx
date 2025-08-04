'use client';

import React, { useState, useMemo } from 'react';
import { useR2Images } from '../../context/R2Context';
import Link from 'next/link';
import Image from 'next/image';
import SmartImage from '../../components/SmartImage';
import '../styles/admin.css';
import { useAuth } from '../auth/useAuth';

// Static export compatible version
export default function AdminPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { images, refreshImages, getOptimizedUrl } = useR2Images();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [renamingImage, setRenamingImage] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const { logout } = useAuth();

  // Filter images based on search keyword
  const filteredImages = useMemo(() => {
    if (!searchKeyword.trim()) {
      return images;
    }
    
    const keyword = searchKeyword.toLowerCase().trim();
    return images.filter(image => 
      image.id.toLowerCase().includes(keyword) || 
      image.key.toLowerCase().includes(keyword)
    );
  }, [images, searchKeyword]);

  // Debug: Log current state after filteredImages is computed (only when changed)
  // Removed excessive logging to prevent mobile performance issues

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setUploadSuccess(false);
      setUploadError(null);
      setUploadProgress({});
    }
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchKeyword('');
  };

  // Image selection handler
  const toggleImageSelection = (key: string) => {
    setSelectedImages(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      return newSelected;
    });
  };

  // Clear selection handler
  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  // Select all images handler (only selects filtered images)
  const selectAllImages = () => {
    if (selectedImages.size === filteredImages.length) {
      // If all filtered images are selected, clear selection
      clearSelection();
    } else {
      // Otherwise select all filtered images
      const filteredKeys = filteredImages.map(img => img.key);
      setSelectedImages(new Set(filteredKeys));
    }
  };

  // Handle image deletion
  const handleDelete = async () => {
    if (selectedImages.size === 0) {
      setDeleteError('Please select at least one image to delete');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} selected image(s)? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';
      const keysToDelete = Array.from(selectedImages);

      const response = await fetch(`${R2_WORKER_BASE_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: keysToDelete }),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete images: ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);

      if (result.deletedCount > 0) {
        setDeleteSuccess(true);
        await refreshImages();
        clearSelection();
      }

      if (result.failedCount > 0) {
        setDeleteError(`Failed to delete ${result.failedCount} image(s). ${result.deletedCount} deleted successfully.`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Unknown error occurred during deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle starting rename mode for an image
  const startRename = (imageKey: string) => {
    setRenamingImage(imageKey);
    // Extract filename without extension for easier editing
    const filename = imageKey.split('.').slice(0, -1).join('.');
    setNewFileName(filename);
    setRenameError(null);
    setRenameSuccess(false);
  };

  // Handle canceling rename
  const cancelRename = () => {
    setRenamingImage(null);
    setNewFileName('');
    setRenameError(null);
  };

  // Handle file rename
  const handleRename = async (oldKey: string) => {
    if (!newFileName.trim()) {
      setRenameError('Please enter a valid filename');
      return;
    }

    // Get the file extension from the original key
    const extension = oldKey.split('.').pop() || '';
    const newKey = `${newFileName.trim()}.${extension}`;

    if (oldKey === newKey) {
      setRenameError('New filename must be different from the current filename');
      return;
    }

    // Basic filename validation
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newFileName)) {
      setRenameError('Filename contains invalid characters');
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';

      const response = await fetch(`${R2_WORKER_BASE_URL}/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldKey, newKey }),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to rename file: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Rename result:', result);

      setRenameSuccess(true);
      setRenamingImage(null);
      setNewFileName('');
      
      // Refresh the images list to show the renamed file
      await refreshImages();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setRenameSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Rename error:', error);
      setRenameError(error instanceof Error ? error.message : 'Unknown error occurred during rename');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      setUploadError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const fileArray = Array.from(files);
      
      console.log('=== UPLOAD STARTED ===');
      console.log('Files to upload:', fileArray.map(f => f.name));
      console.log('Current images before upload:', images.length);
      
      // Process each file sequentially to avoid overwhelming the server
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(prev => ({...prev, [file.name]: 0}));
        
        try {
          // Use original filename
          const originalName = file.name;
          const newFilename = originalName;
          
          console.log(`Uploading file ${i+1}/${fileArray.length}: ${newFilename}`);
          console.log('File details:', { name: file.name, size: file.size, type: file.type });
          console.log('Current images count before upload:', images.length);
          
          // Upload directly to the R2 worker
          const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';
          
          // Create a FormData object for the worker
          const formData = new FormData();
          formData.append('file', file);
          
          // Create an AbortController to handle timeouts
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
          
          console.log(`Making fetch request to ${R2_WORKER_BASE_URL}/upload`);
          
          // First, try a preflight check to see if CORS is working
          try {
            const preflightResponse = await fetch(`${R2_WORKER_BASE_URL}/upload`, {
              method: 'OPTIONS',
              mode: 'cors',
            });
            console.log('Preflight response status:', preflightResponse.status);
          } catch (preflightError) {
            console.warn('Preflight check failed:', preflightError);
            // Continue anyway, as some browsers don't allow manual OPTIONS requests
          }
          
          // Upload directly to the R2 worker with CORS mode explicitly set
          const response = await fetch(`${R2_WORKER_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal,
            headers: {
              // Explicitly don't set Content-Type as browser will set correct one with boundary for FormData
            }
          }).catch(err => {
            if (err.name === 'AbortError') {
              throw new Error('Upload timed out. The server might be busy or unreachable.');
            }
            console.error('Fetch error details:', err);
            throw err;
          });
          
          // Clear the timeout since the request completed
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`R2 worker upload failed for ${newFilename}: ${errorText}`);
            throw new Error(`Upload to R2 failed: ${errorText}`);
          }
          
          // Parse response
          const uploadResult = await response.json();
          console.log('Upload response:', uploadResult);
          console.log('Uploaded file key/filename:', uploadResult.key);
          
          // Update progress
          setUploadProgress(prev => ({...prev, [file.name]: 100}));
          successCount++;
          
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          setUploadProgress(prev => ({...prev, [file.name]: -1})); // -1 indicates error
          errorCount++;
          // Continue with the next file even if this one failed
        }
      }
      
      if (successCount > 0) {
        setUploadSuccess(true);
        console.log('Upload completed successfully, refreshing images...');
        console.log('Images count before refresh:', images.length);
        
        // Capture uploaded filenames before setTimeout
        const uploadedFilenames = fileArray.map(f => f.name);
        console.log('=== UPLOAD COMPLETED ===');
        console.log(`Successfully uploaded ${successCount}/${fileArray.length} files`);
        
        // Wait a moment before refreshing to allow R2 to process
        setTimeout(async () => {
          console.log('Starting image refresh after delay...');
          try {
            await refreshImages();
            console.log('Images count after refresh:', images.length);
            
            // Check if uploaded files are in the refreshed list
            console.log('Files that were uploaded:', uploadedFilenames);
            
            uploadedFilenames.forEach(filename => {
              const found = images.find(img => 
                img.key === filename || 
                img.id === filename || 
                img.key.includes(filename) ||
                img.id.includes(filename)
              );
              console.log(`Uploaded file "${filename}" found in list:`, !!found, found?.key);
            });
            
          } catch (refreshError) {
            console.error('Error during refresh:', refreshError);
          }
        }, 2000); // 2 second delay
      }
      
      if (errorCount > 0) {
        if (successCount > 0) {
          setUploadError(`${successCount} file(s) uploaded successfully, but ${errorCount} file(s) failed to upload.`);
        } else {
          setUploadError(`All ${errorCount} file(s) failed to upload. Check console for details.`);
        }
      }
      
      // Clear files after upload attempt
      setFiles(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown upload error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" className="admin-home-link">Back to Home</Link>
          <button
            type="button"
            className="admin-home-link"
            style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', cursor: 'pointer' }}
            onClick={logout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-upload-section">
          <h2>Upload Images to R2</h2>
          <form onSubmit={handleUpload} className="admin-upload-form">
            <div className="file-input-container">
              <label htmlFor="file-upload" className="file-input-label">
                {files ? `${files.length} file(s) selected` : 'Choose Files'}
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="file-input"
                />
              </label>
              
              {files && Array.from(files).length > 0 && (
                <div className="file-previews">
                  {Array.from(files).map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        className="file-preview-image" 
                      />
                      <div className="file-preview-info">
                        <span className="file-preview-name">{file.name}</span>
                        {uploadProgress[file.name] !== undefined && (
                          <div className={`file-upload-progress ${uploadProgress[file.name] === -1 ? 'error' : ''}`}>
                            {uploadProgress[file.name] === -1 ? 'Failed' : 
                             uploadProgress[file.name] === 100 ? 'Uploaded' : 
                             `${uploadProgress[file.name]}%`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="upload-button" 
              disabled={!files || files.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload to R2'}
            </button>
            
            {uploadSuccess && !uploadError && (
              <div className="upload-success">
                Files uploaded successfully!
              </div>
            )}
            
            {uploadError && (
              <div className="upload-error">
                Error: {uploadError}
              </div>
            )}
          </form>
        </div>
        
        <div className="admin-images-section">
          <div className="admin-images-header">
            <h2>Current Images ({filteredImages.length}{images.length !== filteredImages.length ? ` of ${images.length}` : ''})</h2>
            <div className="admin-search-container">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search images..."
                value={searchKeyword}
                onChange={handleSearchChange}
                aria-label="Search images"
              />
              {searchKeyword && (
                <button 
                  className="admin-search-clear" 
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="admin-images-actions">
              <button 
                onClick={async () => {
                  console.log('Manual refresh triggered');
                  await refreshImages();
                  console.log('Manual refresh completed');
                }}
                className="admin-action-button"
              >
                🔄 Refresh Images
              </button>
              <button 
                onClick={selectAllImages} 
                className="admin-action-button"
                disabled={filteredImages.length === 0}
              >
                {selectedImages.size === filteredImages.length && filteredImages.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                onClick={handleDelete}
                className="admin-action-button delete-button" 
                disabled={selectedImages.size === 0 || isDeleting}
              >
                {isDeleting ? 'Deleting...' : `Delete Selected (${selectedImages.size})`}
              </button>
              {selectedImages.size > 0 && (
                <button onClick={clearSelection} className="admin-action-button">
                  Clear Selection
                </button>
              )}
            </div>
          </div>
          
          {deleteSuccess && (
            <div className="delete-success">
              Images deleted successfully!
            </div>
          )}
          
          {deleteError && (
            <div className="delete-error">
              Error: {deleteError}
            </div>
          )}
          
          {renameSuccess && (
            <div className="rename-success">
              File renamed successfully!
            </div>
          )}
          
          {renameError && (
            <div className="rename-error">
              Error: {renameError}
            </div>
          )}
          
          {filteredImages.length === 0 && (
            <div className="no-images-message">
              {images.length === 0 ? 'No images available in the bucket.' : 'No images match your search.'}
            </div>
          )}
          
          <div className="admin-images-grid">
            {filteredImages.map((image) => (
              <div 
                key={image.id} 
                className={`admin-image-card ${selectedImages.has(image.key) ? 'selected' : ''} ${renamingImage === image.key ? 'renaming' : ''}`}
              >
                {renamingImage === image.key ? (
                  // Rename mode
                  <div className="admin-image-rename-mode">
                    <div className="admin-image-selection">
                      <input 
                        type="checkbox" 
                        checked={selectedImages.has(image.key)} 
                        onChange={() => toggleImageSelection(image.key)}
                        title={`Select ${image.id}`}
                        aria-label={`Select ${image.id}`}
                      />
                    </div>
                    <SmartImage 
                      src={image.url} 
                      alt={image.id} 
                      width={150} 
                      height={180} 
                      className="admin-image-thumbnail" 
                      quality={80}
                      sizes="(max-width: 768px) 100vw, 150px"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      showCompressionStats={true}
                      useWebWorker={true}
                      fadeIn={true}
                    />
                    <div className="admin-image-rename-controls">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(image.key);
                          } else if (e.key === 'Escape') {
                            cancelRename();
                          }
                        }}
                        className="admin-rename-input"
                        placeholder="Enter new filename"
                        disabled={isRenaming}
                        autoFocus
                      />
                      <div className="admin-rename-buttons">
                        <button
                          onClick={() => handleRename(image.key)}
                          disabled={isRenaming || !newFileName.trim()}
                          className="admin-rename-save"
                          title="Save rename (Enter)"
                        >
                          {isRenaming ? '...' : '✓'}
                        </button>
                        <button
                          onClick={cancelRename}
                          disabled={isRenaming}
                          className="admin-rename-cancel"
                          title="Cancel rename (Escape)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal mode
                  <div 
                    className="admin-image-normal-mode"
                    onClick={() => toggleImageSelection(image.key)}
                  >
                    <div className="admin-image-selection">
                      <input 
                        type="checkbox" 
                        checked={selectedImages.has(image.key)} 
                        onChange={() => toggleImageSelection(image.key)}
                        onClick={(e) => e.stopPropagation()}
                        title={`Select ${image.id}`}
                        aria-label={`Select ${image.id}`}
                      />
                    </div>
                    <SmartImage 
                      src={image.url} 
                      alt={image.id} 
                      width={150} 
                      height={180} 
                      className="admin-image-thumbnail" 
                      quality={80}
                      sizes="(max-width: 768px) 100vw, 150px"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      showCompressionStats={true}
                      useWebWorker={true}
                      fadeIn={true}
                    />
                    <div className="admin-image-info">
                      <div className="admin-image-name-row">
                        <p className="admin-image-name" title={image.key}>{image.id}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(image.key);
                          }}
                          className="admin-rename-button"
                          title="Rename file"
                          aria-label={`Rename ${image.id}`}
                        >
                          ✏️
                        </button>
                      </div>
                      <p className="admin-image-date">
                        {new Date(image.created).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 