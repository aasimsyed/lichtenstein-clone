import { NextResponse } from 'next/server';
import { fetchR2Images } from '../../utils/r2-server';
import { parseFilename } from '../../utils/filename-utils';

// Add force-static for compatibility with static export
export const dynamic = 'force-static';

export async function GET() {
  try {
    // Fetch images from R2
    const resources = await fetchR2Images();
    
    // Transform resources into a format compatible with our app
    const images = resources.map((resource) => {
      // Extract format from the file extension
      const format = resource.key.split('.').pop() || 'jpg';
      
      // Parse the filename to extract metadata (using existing utility)
      const { catalogNumber, title, artist, size } = parseFilename(resource.key);
      
      return {
        id: resource.key.replace(/\.[^/.]+$/, ""), // Remove extension for ID
        url: resource.url,
        width: 1000, // Placeholder width
        height: 1200, // Placeholder height
        format,
        created: resource.uploaded,
        // Add metadata
        catalogNumber,
        title,
        artist,
        size
      };
    });
    
    console.log(`R2 API returned ${images.length} images`);
    
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