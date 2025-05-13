'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export default function ImageUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ success: null, message: '' });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Create preview URLs for the files
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      progress: 'pending'
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const uploadFiles = async () => {
    if (files.length === 0 || uploading) return;
    
    setUploading(true);
    setUploadStatus({ success: null, message: '' });
    
    // Create a copy of the files to track upload progress
    const filesToUpload = [...files];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const fileData = filesToUpload[i];
      
      if (fileData.progress === 'success') {
        successCount++;
        continue; // Skip already uploaded files
      }
      
      // Update file status to uploading
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileData.id ? { ...f, progress: 'uploading' } : f
        )
      );
      
      try {
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', fileData.file);
        
        // Send the file to the R2 worker
        const response = await fetch('https://r2-image-worker.aasim-ss.workers.dev/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Update file status to success
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === fileData.id ? { ...f, progress: 'success', url: result.url } : f
            )
          );
          successCount++;
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error(`Error uploading ${fileData.name}:`, error);
        
        // Update file status to error
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === fileData.id ? { ...f, progress: 'error', errorMessage: error.message } : f
          )
        );
        errorCount++;
      }
    }
    
    setUploading(false);
    
    // Set overall upload status message
    if (errorCount === 0 && successCount > 0) {
      setUploadStatus({ 
        success: true, 
        message: `Successfully uploaded ${successCount} ${successCount === 1 ? 'file' : 'files'}`
      });
    } else if (errorCount > 0) {
      setUploadStatus({ 
        success: false, 
        message: `${errorCount} ${errorCount === 1 ? 'file' : 'files'} failed to upload. ${successCount} succeeded.`
      });
    }
  };

  const removeFile = (id) => {
    // Remove file preview URL to prevent memory leaks
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    setFiles(prevFiles => prevFiles.filter(f => f.id !== id));
  };

  const clearFiles = () => {
    // Clean up all previews
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setFiles([]);
    setUploadStatus({ success: null, message: '' });
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="admin-upload-section">
      <h2>Upload Images</h2>
      
      <div className="admin-upload-form">
        <div className="file-input-container">
          <label className="file-input-label">
            Click or drag images here
            <input
              type="file"
              className="file-input"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
          
          {files.length > 0 && (
            <div className="file-previews">
              {files.map(file => (
                <div key={file.id} className="file-preview-item">
                  <div style={{ position: 'relative', width: '100%', height: '120px' }}>
                    <Image
                      src={file.preview}
                      alt={file.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="file-preview-image"
                    />
                    <button
                      onClick={() => removeFile(file.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="file-preview-info">
                    <span className="file-preview-name">{file.name}</span>
                    <div 
                      className={`file-upload-progress ${file.progress === 'error' ? 'error' : ''}`}
                    >
                      {file.progress === 'pending' && 'Ready to upload'}
                      {file.progress === 'uploading' && 'Uploading...'}
                      {file.progress === 'success' && 'Uploaded!'}
                      {file.progress === 'error' && (file.errorMessage || 'Failed')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Upload status message */}
        {uploadStatus.success === true && (
          <div className="upload-success">{uploadStatus.message}</div>
        )}
        
        {uploadStatus.success === false && (
          <div className="upload-error">{uploadStatus.message}</div>
        )}
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="upload-button"
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading || files.every(f => f.progress === 'success')}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
          
          {files.length > 0 && (
            <button
              onClick={clearFiles}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              disabled={uploading}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 