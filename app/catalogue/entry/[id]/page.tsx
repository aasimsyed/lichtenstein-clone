// This must be a Server Component (no 'use client' directive)
import React from 'react';
import { parseFilename } from '../../../utils/filename-utils';
import { fetchCloudinaryImages } from '../../../utils/cloudinary-utils';
import BackButton from './BackButton';
import ZoomableImage from './ZoomableImage';

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
    // Use the utility function to fetch all images from Cloudinary directly
    const images = await fetchCloudinaryImages(true); // Force ignore cache to get fresh data
    
    // Try to find the image by both numeric index and by matching the ID in the public_id
    const numericId = parseInt(id);
    let image;
    
    // First try finding by index
    if (!isNaN(numericId) && numericId > 0 && numericId <= images.length) {
      image = images[numericId - 1];
    }
    
    // If not found by index, try finding by matching the ID in the public_id
    if (!image) {
      image = images.find(img => {
        const imgId = img.id.split('/').pop(); // Get last part of the path
        return imgId === id || img.id.includes(`/${id}`) || img.id.endsWith(id);
      });
    }
    
    // If still not found, look for anything that might contain this ID
    if (!image && !isNaN(numericId)) {
      image = images.find(img => img.id.includes(id));
    }
    
    if (!image) {
      console.error(`Artwork with ID "${id}" not found. Available IDs:`, 
        images.slice(0, 5).map(img => img.id)); // Log first 5 for debugging
      return null;
    }
    
    const { catalogNumber, title, artist, size } = parseFilename(image.url);
    
    // Create artwork object
    return {
      id: parseInt(id),
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
    console.error('Error fetching artwork:', err);
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