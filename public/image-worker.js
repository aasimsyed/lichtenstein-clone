// Web Worker for background image processing
// This runs in a separate thread to avoid blocking the UI

self.onmessage = async function(e) {
  const { imageUrl, width, height, quality, id } = e.data;
  
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image: ' + response.statusText);
    }
    
    const blob = await response.blob();
    
    // Create image bitmap for processing
    const imageBitmap = await createImageBitmap(blob);
    
    // Create offscreen canvas for processing
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Calculate scaling to maintain aspect ratio
    const scale = Math.min(width / imageBitmap.width, height / imageBitmap.height);
    const scaledWidth = imageBitmap.width * scale;
    const scaledHeight = imageBitmap.height * scale;
    
    // Center the image
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;
    
    // Set canvas background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the resized image
    ctx.drawImage(imageBitmap, x, y, scaledWidth, scaledHeight);
    
    // Convert to optimized blob
    const optimizedBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: quality / 100
    });
    
    // Create object URL
    const objectUrl = URL.createObjectURL(optimizedBlob);
    
    // Send the optimized image back
    self.postMessage({
      id,
      success: true,
      objectUrl,
      originalSize: blob.size,
      optimizedSize: optimizedBlob.size,
      compressionRatio: ((blob.size - optimizedBlob.size) / blob.size * 100).toFixed(1)
    });
    
    // Clean up
    imageBitmap.close();
    
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message,
      fallbackUrl: imageUrl
    });
  }
};