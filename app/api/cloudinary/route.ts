import { NextResponse } from 'next/server';
import { fetchCloudinaryImages } from '../../utils/cloudinary-utils';

export async function GET() {
  try {
    // Use the utility function to fetch images
    const images = await fetchCloudinaryImages();
    
    // Return the list of images
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error in Cloudinary API route:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 