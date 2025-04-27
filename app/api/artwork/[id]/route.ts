import { NextRequest, NextResponse } from 'next/server';
import { fetchCloudinaryImages, getOptimizedServerUrl } from '../../../utils/cloudinary-server';
import { parseFilename } from '../../../utils/filename-utils';

type Params = {
  id: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    // Await the params to resolve the Promise
    const { id } = await params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid artwork ID' },
        { status: 400 }
      );
    }
    
    // Use the server-side utility function to fetch images from Cloudinary
    const images = await fetchCloudinaryImages();
    
    // Find the specific image by index
    const index = parseInt(id) - 1;
    if (index < 0 || index >= images.length) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }
    
    const image = images[index];
    const { catalogNumber, title, artist, size } = parseFilename(image.secure_url);
    
    // Check if this is a zine (FZ)
    const isZine = catalogNumber === 'FZ';
    
    // Create optimized image URL for high quality viewing
    const optimizedImageUrl = await getOptimizedServerUrl(image, {
      width: 1600,
      quality: 90,
      format: 'auto'
    });
    
    // Create artwork object
    const artwork = {
      id: parseInt(id),
      title,
      date: '',
      medium: '',
      dimensions: '',
      location: '',
      catalogNumber,
      artist,
      size,
      imageUrl: image.secure_url,
      width: image.width,
      height: image.height,
      optimizedImageUrl,
      isZine,
      additionalInfo: ''
    };
    
    // Add cache header - cache for 1 hour
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600');
    
    return NextResponse.json({ artwork }, { headers });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artwork data' },
      { status: 500 }
    );
  }
} 