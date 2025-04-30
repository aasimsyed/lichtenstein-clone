// This must be a Server Component (no 'use client' directive)
import React from 'react';
import { parseFilename } from '../../../utils/filename-utils';
import { getOptimizedR2Images } from '../../../utils/r2-server';
import BackButton from './BackButton';
import ZoomableImage from './ZoomableImage';

// Remove the edge runtime
// export const runtime = 'edge';

// Add generateStaticParams to pre-generate routes at build time
export async function generateStaticParams() {
  try {
    // Fetch actual images to generate paths for all existing artworks
    const images = await getOptimizedR2Images(); // Fetch the R2Image list
    
    // Generate params using the actual image ID
    let params = images.map((image) => ({
      id: image.id, // Use the actual image ID from R2Image
    }));

    // Known artwork IDs that might be accessed but weren't found in R2
    const fallbackIds = [
      'A1_55_Jimi.Hendrix_Martin.Sharp',
      'A6_55_Fat.Freddys.Cat',
      // Add other known IDs that were causing issues
    ];

    // Add fallback IDs to params if they don't already exist
    for (const fallbackId of fallbackIds) {
      if (!params.some(p => p.id === fallbackId)) {
        params.push({ id: fallbackId });
      }
    }

    // Add numeric IDs from 1 to the total number of images
    // This is needed because SelectionsCarousel uses index+1 as the ID
    const totalImages = images.length;
    for (let i = 1; i <= totalImages; i++) {
      const numericId = i.toString();
      if (!params.some(p => p.id === numericId)) {
        params.push({ id: numericId });
      }
    }

    // Also add some buffer for potential future images (up to 100)
    for (let i = totalImages + 1; i <= 100; i++) {
      params.push({ id: i.toString() });
    }

    // Log the generated params for debugging
    console.log('[generateStaticParams] Generated IDs:', JSON.stringify(params.map(p => p.id), null, 2));

    return params;
  } catch (error: unknown) {
    console.error('Error generating static params for artwork entries:', error);
    
    // Instead of throwing an error which would fail the build, return a set of fallback IDs
    console.warn('Falling back to predefined artwork IDs');
    
    // Return a set of fallback IDs to ensure the build succeeds, including numeric IDs up to 100
    const fallbackParams = [
      { id: 'A1_55_Jimi.Hendrix_Martin.Sharp' },
      { id: 'A6_55_Fat.Freddys.Cat' },
      // Add numeric IDs from 1 to 100 as fallbacks
    ];
    
    // Add numeric IDs from 1 to 100
    for (let i = 1; i <= 100; i++) {
      fallbackParams.push({ id: i.toString() });
    }
    
    return fallbackParams;
  }
}

interface Artwork {
  id: number;
  title: string;
  date: string;
  medium: string;
  dimensions: string;
  location: string;
  catalogueNumber: string;
  artist: string;
  size: string;
  imageUrl: string;
}

async function getArtworkData(id: string): Promise<Artwork | null> {
  try {
    // Decode the ID parameter in case it's URL-encoded (e.g., spaces become %20)
    const decodedId = decodeURIComponent(id);

    // Use the utility function to fetch all images from R2 directly, ignoring cache
    const images = await getOptimizedR2Images(true);

    // Check if the ID is numeric (from carousel index)
    if (/^\d+$/.test(decodedId)) {
      const index = parseInt(decodedId, 10) - 1; // Convert to zero-based index
      if (index >= 0 && index < images.length) {
        // Use the image at the given index
        const image = images[index];
        
        // Parse filename details
        const { catalogNumber, title, artist, size } = parseFilename(image.url);
        
        return {
          id: parseInt(decodedId), // Store the numeric ID
          title: title,
          date: '',
          medium: '',
          dimensions: '',
          location: '',
          catalogueNumber: catalogNumber,
          artist: artist,
          size: size,
          imageUrl: image.url
        };
      } else {
        // Numeric ID out of bounds
        console.warn(`Numeric ID out of bounds: ${decodedId} (max: ${images.length})`);
        // Return placeholder for out-of-bounds numeric IDs
        return createPlaceholderArtwork(decodedId);
      }
    }

    // Find the image by matching the DECODED ID directly
    // generateStaticParams should ensure 'decodedId' is a valid image ID from this list
    let image = images.find(img => img.id === decodedId);

    if (!image) {
      // This can happen for manually added fallback IDs
      console.warn(`Artwork not found for ID: "${decodedId}". Creating placeholder.`);
      return createPlaceholderArtwork(decodedId);
    }

    // Parse filename details (assuming parseFilename handles the URL correctly)
    const { catalogNumber, title, artist, size } = parseFilename(image.url);

    // Create artwork object - Use the decoded ID for parsing if it's intended to be numeric
    const numericId = parseInt(decodedId); // Try parsing the decoded ID
    const artworkId = isNaN(numericId) ? 0 : numericId; // Use 0 or another indicator if ID isn't numeric

    return {
      id: artworkId, // Store the numeric part if possible, or a placeholder
      title: title,
      date: '',  // No year information
      medium: '',  // Not displayed anymore
      dimensions: '',  // Not displayed anymore
      location: '',  // Not displayed anymore
      catalogueNumber: catalogNumber,
      artist: artist,
      size: size,
      imageUrl: image.url
    };
  } catch (err) {
    console.error(`Error fetching artwork data for Original ID "${id}":`, err);
    return createPlaceholderArtwork(id);
  }
}

// Helper function to create placeholder artwork data
function createPlaceholderArtwork(id: string): Artwork {
  // Use a data URI SVG as a placeholder
  const placeholderDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23f0f0f0'/%3E%3Ctext x='400' y='400' font-family='Arial' font-size='32' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EArtwork Not Found%3C/text%3E%3C/svg%3E";
  
  // Extract data from ID if possible, assuming ID format like 'A1_55_Jimi.Hendrix_Martin.Sharp'
  const parts = id.split('_');
  
  // Return a placeholder with data extracted from ID if possible
  return {
    id: /^\d+$/.test(id) ? parseInt(id) : 0,
    title: parts.length > 2 ? parts.slice(2).join(' ').replace(/\./g, ' ') : 'Artwork Not Found',
    date: '',
    medium: '',
    dimensions: '',
    location: '',
    catalogueNumber: parts.length > 1 ? parts[0] : 'N/A',
    artist: parts.length > 2 ? parts[2].replace(/\./g, ' ') : 'Unknown Artist',
    size: parts.length > 1 ? parts[1] : 'Unknown Size',
    imageUrl: placeholderDataUri
  };
}

// Use the basic page component interface for Next.js
export default async function Page({ params }) {
  const { id } = params;

  try {
    // Verify ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID parameter');
    }
    
    // Fetch artwork data
    const artwork = await getArtworkData(id);
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Render the artwork page
    return (
      <div id="mainBody">
        <div id="pageTopMatter">
          <h1>
            {artwork.catalogueNumber === 'AD' ? (
              <>Catalog</>
            ) : artwork.catalogueNumber.startsWith('FZ_') ? (
              <>
                {artwork.title.replace(/_/g, ' ')} #{artwork.catalogueNumber.split('_')[2]}
              </>
            ) : (
              artwork.title
            )}
          </h1>
        </div>

        <div id="entryContainer">
          <div className="entryNavigation">
            <BackButton />
          </div>

          <div className="entryContent">
            {artwork.catalogueNumber !== 'AD' && (
              <div className="entrySideInfo">
                <div className="entryMetadata">
                  {artwork.catalogueNumber.startsWith('FZ_') ? (
                    <>
                      <div className="entryAttribute">
                        <div className="attributeLabel">Title:</div>
                        <div className="attributeValue">
                          {artwork.title.replace(/_/g, ' ')} #{artwork.catalogueNumber.split('_')[2]}
                        </div>
                      </div>
                      <div className="entryAttribute">
                        <div className="attributeLabel">Catalogue Number:</div>
                        <div className="attributeValue">Flyer/Zine</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="entryAttribute">
                        <div className="attributeLabel">Artist:</div>
                        <div className="attributeValue">{artwork.artist}</div>
                      </div>
                      <div className="entryAttribute">
                        <div className="attributeLabel">Catalogue Number:</div>
                        <div className="attributeValue">{artwork.catalogueNumber}</div>
                      </div>
                      <div className="entryAttribute">
                        <div className="attributeLabel">Size:</div>
                        <div className="attributeValue">{artwork.size}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="entryImageContainer">
              <ZoomableImage 
                src={artwork.imageUrl}
                alt={artwork.title}
                width={800} 
                height={800}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Handle errors with a simple error page
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return (
      <div id="mainBody">
        <div className="error">{errorMessage}</div>
        <div className="entryNavigation">
          <BackButton />
        </div>
      </div>
    );
  }
} 