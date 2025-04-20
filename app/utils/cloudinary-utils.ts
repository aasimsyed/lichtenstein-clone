import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dujkb1y9j',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Define the types for Cloudinary resources and images
interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
}

export interface CloudinaryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created: string;
}

/**
 * Fetches images from Cloudinary
 * @returns A Promise resolving to an array of CloudinaryImage objects
 */
export async function fetchCloudinaryImages(): Promise<CloudinaryImage[]> {
  try {
    // Add a timestamp to bust the cache
    const timestamp = new Date().getTime();
    
    // Fetch images from the specified folder
    const result = await cloudinary.search
      .expression('folder:rupture/badges')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    // Transform the resources into our CloudinaryImage format with cache-busting
    return result.resources.map((resource: CloudinaryResource) => ({
      id: resource.public_id,
      // Add a timestamp parameter to the URL to prevent browser caching
      url: `${resource.secure_url}?t=${timestamp}`,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      created: resource.created_at
    }));
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    return [];
  }
} 