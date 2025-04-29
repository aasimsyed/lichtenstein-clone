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
    const params = images.map((image) => ({
      id: image.id, // Use the actual image ID from R2Image
    }));

    // Log the generated params for debugging
    console.log('[generateStaticParams] Generated IDs:', JSON.stringify(params.map(p => p.id), null, 2));

    return params;
  } catch (error: unknown) {
    console.error('Error generating static params for artwork entries:', error);
    
    // If we can't get real data, throw an error to fail the build so we're aware of the issue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate static params for artwork entries: ${errorMessage}`);
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

    // Find the image by matching the DECODED ID directly
    // generateStaticParams should ensure 'decodedId' is a valid image ID from this list
    const image = images.find(img => img.id === decodedId);

    if (!image) {
      // This theoretically shouldn't happen if generateStaticParams worked correctly
      // Log the original and decoded ID, and the first few available IDs for debugging
      console.error(`Artwork not found during page generation. Original ID: "${id}", Decoded ID: "${decodedId}". Available IDs start with:`, 
        images.slice(0, 5).map(img => img.id)); 
      return null;
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
    return null;
  }
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