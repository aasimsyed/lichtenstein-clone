import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary on the server
cloudinary.config({
  cloud_name: 'dujkb1y9j',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Server-side function to fetch Cloudinary images
async function fetchImages() {
  try {
    // Fetch images from the specified folder
    const result = await cloudinary.search
      .expression('folder:rupture/badges')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    // Return the resources directly
    return result.resources;
  } catch (err) {
    console.error('Error fetching from Cloudinary:', err);
    throw err;
  }
}

// API route handler
export async function GET() {
  try {
    const resources = await fetchImages();
    return NextResponse.json({ images: resources });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Cloudinary images' },
      { status: 500 }
    );
  }
} 