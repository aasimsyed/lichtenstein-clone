import { NextResponse } from 'next/server';
import { getOptimizedR2Images } from '../../../utils/r2-server'; // Use server utility
import { parseFilename } from '../../../utils/filename-utils';

// This route should be dynamic to fetch live data
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('Fetching LIVE images via /api/images/live');
  try {
    // Fetch images using the server utility, forcing a refresh
    // getOptimizedR2Images handles the actual fetch from the worker
    const resources = await getOptimizedR2Images(true); // Pass true to bypass server cache

    // Transform resources into the format needed by the frontend
    const images = resources.map((resource) => {
      const metadata = parseFilename(resource.id); // Parse ID (key without extension)
      return {
        ...resource, // Includes id, url, width, height, format, created
        // Add potentially missing metadata if needed by frontend
        catalogueNumber: metadata.catalogNumber || 'N/A',
        title: metadata.title || 'Untitled',
        artist: metadata.artist || 'Unknown',
        size: metadata.size || 'Unknown'
      };
    });

    console.log(`LIVE API returned ${images.length} images`);

    return NextResponse.json({ 
      images,
      count: images.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in LIVE R2 API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch live images', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 