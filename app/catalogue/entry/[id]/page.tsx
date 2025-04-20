// This must be a Server Component (no 'use client' directive)
import React from 'react';
import SmoothImage from '../../../components/SmoothImage';
import { parseFilename } from '../../../utils/filename-utils';
import { fetchCloudinaryImages } from '../../../utils/cloudinary-utils';
import BackButton from './BackButton';

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
    const images = await fetchCloudinaryImages();
    
    // Find the specific image by index
    const index = parseInt(id) - 1;
    if (index < 0 || index >= images.length) {
      return null;
    }
    
    const image = images[index];
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

// Remove type annotations and let Next.js infer the types
export default async function EntryPage(props) {
  try {
    // Safely extract the ID parameter
    const id = props?.params?.id;
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
          <h1>{artwork.title}</h1>
        </div>

        <div id="entryContainer">
          <div className="entryNavigation">
            <BackButton />
          </div>

          <div className="entryContent">
            <div className="entrySideInfo">
              <div className="entryMetadata">
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
              </div>
            </div>

            <div className="entryImageContainer">
              <SmoothImage
                src={artwork.imageUrl}
                alt={artwork.title}
                width={800}
                height={800}
                className="entryMainImage"
                priority
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          <div className="entryNavigation">
            <BackButton />
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