# R2 Worker Image Processing Implementation Guide

## 🎯 Option 1: ImageKit Integration (Recommended)

### Setup Steps:

1. **Sign up for ImageKit** (Free tier: 20GB bandwidth, 20GB storage)
   - Go to https://imagekit.io/
   - Create account and get your ImageKit ID

2. **Configure ImageKit**
   - Upload your images to ImageKit or configure origin
   - Get your ImageKit URL ID from dashboard

3. **Update R2 Worker**
   - Replace `YOUR_IMAGEKIT_ID` in the worker code with your actual ID
   - Deploy the updated worker

### Usage:
```
Original: https://r2-worker.com/image.jpg
Optimized: https://r2-worker.com/image.jpg?w=300&q=80&f=webp
Result: Automatically resized to 300px width, 80% quality, WebP format
```

---

## 🛠 Option 2: Cloudflare Native Image Resizing

```javascript
// Alternative implementation using Cloudflare's image resizing
async function handleImageTransformation(request, env, url) {
  try {
    const corsHeaders = getCORSHeaders();
    const imageKey = url.pathname.slice(1);
    
    // Get transformation parameters
    const width = url.searchParams.get('w') || '';
    const height = url.searchParams.get('h') || '';
    const quality = url.searchParams.get('q') || '85';
    const format = url.searchParams.get('f') || 'webp';
    
    // Build Cloudflare Image Resizing URL
    const params = [];
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    params.push(`quality=${quality}`);
    params.push(`format=${format}`);
    
    const resizeUrl = `/cdn-cgi/image/${params.join(',')}/${request.url}`;
    
    // Fetch from Cloudflare's image resizing
    const resizedResponse = await fetch(resizeUrl, {
      cf: {
        image: {
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          quality: parseInt(quality),
          format: format
        }
      }
    });
    
    if (resizedResponse.ok) {
      return new Response(resizedResponse.body, {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=31536000',
          'X-Optimized': `cloudflare-${width}x${height}-q${quality}`,
          ...corsHeaders
        }
      });
    }
    
    // Fallback to original
    const original = await env.MY_BUCKET.get(imageKey);
    return new Response(original.body, {
      headers: {
        'Content-Type': original.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'X-Optimized': 'fallback-original',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Cloudflare resize error:', error);
    // Return original image
    const original = await env.MY_BUCKET.get(url.pathname.slice(1));
    return new Response(original.body, {
      headers: {
        'Content-Type': original.httpMetadata?.contentType || 'image/jpeg',
        ...getCORSHeaders()
      }
    });
  }
}
```

---

## ⚡ Option 3: WASM Image Processing with Squoosh

### Setup:
```bash
npm install @squoosh/lib
```

### Implementation:
```javascript
import { ImagePool } from '@squoosh/lib';

let imagePool;

async function handleImageTransformation(request, env, url) {
  try {
    // Initialize image pool once
    if (!imagePool) {
      imagePool = new ImagePool(1); // 1 worker thread
    }
    
    const corsHeaders = getCORSHeaders();
    const imageKey = url.pathname.slice(1);
    
    // Get original image from R2
    const object = await env.MY_BUCKET.get(imageKey);
    if (!object) {
      return new Response('Image not found', { status: 404, headers: corsHeaders });
    }
    
    // Get transformation parameters
    const width = url.searchParams.get('w') ? parseInt(url.searchParams.get('w')) : null;
    const height = url.searchParams.get('h') ? parseInt(url.searchParams.get('h')) : null;
    const quality = url.searchParams.get('q') ? parseInt(url.searchParams.get('q')) : 85;
    const format = url.searchParams.get('f') || 'webp';
    
    // Convert stream to array buffer
    const arrayBuffer = await object.arrayBuffer();
    
    // Process with Squoosh
    const image = imagePool.ingestImage(new Uint8Array(arrayBuffer));
    
    // Resize if needed
    if (width || height) {
      await image.preprocess({
        resize: {
          enabled: true,
          width: width || undefined,
          height: height || undefined,
          method: 'lanczos3',
          fitMethod: 'stretch',
          premultiply: true,
          linearRGB: true
        }
      });
    }
    
    // Encode to desired format
    const encodeOptions = format === 'webp' 
      ? { webp: { quality } }
      : { mozjpeg: { quality } };
      
    await image.encode(encodeOptions);
    
    const encodedImage = await image.encodedWith[format === 'webp' ? 'webp' : 'mozjpeg'];
    
    return new Response(encodedImage.binary, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000',
        'X-Optimized': `squoosh-${width || 'auto'}x${height || 'auto'}-q${quality}`,
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('WASM processing error:', error);
    
    // Fallback to original
    const original = await env.MY_BUCKET.get(url.pathname.slice(1));
    return new Response(original.body, {
      headers: {
        'Content-Type': original.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'X-Optimized': 'fallback-original',
        ...getCORSHeaders()
      }
    });
  }
}
```

---

## 🚀 Quick Deployment

### For ImageKit (Recommended):
1. Get your ImageKit ID from dashboard
2. Update the worker code: Replace `YOUR_IMAGEKIT_ID`
3. Deploy:
```bash
cd /tmp
cp /path/to/your/r2-worker.js .
cp /path/to/your/wrangler-worker.toml .
npx wrangler deploy r2-worker.js --config wrangler-worker.toml
```

### Test Your Implementation:
```bash
# Test original image
curl -I "https://r2-image-worker.aasim-ss.workers.dev/A1_55_Jimi.Hendrix_Martin.Sharp.webp"

# Test optimized image
curl -I "https://r2-image-worker.aasim-ss.workers.dev/A1_55_Jimi.Hendrix_Martin.Sharp.webp?w=300&q=80&f=webp"
```

---

## 📊 Performance Comparison

| Method | Setup Complexity | Performance | Cost | Reliability |
|--------|------------------|-------------|------|-------------|
| **ImageKit** | ⭐⭐ Easy | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Free tier | ⭐⭐⭐⭐⭐ High |
| **Cloudflare Native** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐⭐ Medium |
| **WASM/Squoosh** | ⭐⭐⭐⭐ Complex | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐ Good |

**Recommendation**: Start with **ImageKit** for immediate results, then consider Cloudflare Native for long-term cost optimization.