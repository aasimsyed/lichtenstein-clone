import { NextResponse } from 'next/server';
import { fetchCloudinaryImages } from '../../utils/cloudinary-utils';

export async function GET() {
  try {
    // Use the utility function to fetch images, ignoring cache to get fresh data
    const images = await fetchCloudinaryImages(true);
    
    console.log(`Cloudinary API returned ${images.length} images`);
    if (images.length === 0) {
      console.error('Cloudinary API returned zero images - check credentials and folder path');
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
    console.error('Error in Cloudinary API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 