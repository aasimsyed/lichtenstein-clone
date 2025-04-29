import { NextResponse } from 'next/server';
import { fetchR2Images } from '../../utils/r2-client';

// Add force-static for compatibility with static export
export const dynamic = 'force-static';

// Remove Edge Runtime
// export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch images from R2
    const images = await fetchR2Images(true);
    
    console.log(`R2 API returned ${images.length} images`);
    
    if (images.length === 0) {
      console.error('R2 API returned zero images - check configuration and bucket path');
    } else {
      // Log some sample data to help with debugging
      console.log('Sample image IDs:', images.slice(0, 5).map(img => img.id));
    }
    
    // Return the list of images with count for debugging
    return NextResponse.json({ 
      images,
      count: images.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in R2 API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 