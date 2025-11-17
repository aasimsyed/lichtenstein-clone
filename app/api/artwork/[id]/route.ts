import { NextRequest, NextResponse } from 'next/server';
import { fetchR2Images, getOptimizedR2Url } from '../../../utils/r2-server';
import { parseFilename } from '../../../utils/filename-utils';

// Add force-static for compatibility with static export
export const dynamic = 'force-static';

// Add generateStaticParams to pre-generate routes at build time
export async function generateStaticParams() {
  try {
    // Preventing runtime errors when building static export
    return [{ id: '1' }, { id: '2' }, { id: '3' }]; // Add placeholder IDs for build time
  } catch (error) {
    console.error("Error generating static params:", error);
    return []; // Return empty array if fetching fails
  }
}

// Remove Edge Runtime - these API routes won't be available in the static export
// They will need to be replaced by client-side data fetching or static generation
// export const runtime = 'edge';

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
    
    // Use the server-side utility function to fetch images from R2
    const images = await fetchR2Images();
    
    // Find the specific image by index
    const index = parseInt(id) - 1;
    if (index < 0 || index >= images.length) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }
    
    const image = images[index];
    const { catalogNumber, title, artist, size } = parseFilename(image.url);
    
    // Check if this is a zine (FZ)
    const isZine = catalogNumber === 'FZ';
    
    // Create optimized image URL for high quality viewing
    const optimizedImageUrl = getOptimizedR2Url(image.key, {
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
      imageUrl: image.url,
      width: 1000, // Using placeholder values since R2 may not provide dimensions
      height: 1200,
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