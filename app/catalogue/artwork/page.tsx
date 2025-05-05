'use client';

import { useSearchParams } from 'next/navigation';
import BackButton from '../entry/[id]/BackButton';
import ZoomableImage from '../entry/[id]/ZoomableImage';
import { parseFilename } from '../../utils/filename-utils';
import { useR2Images } from '../../../context/R2Context';

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

export default function ArtworkPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { images, loading, error } = useR2Images();
  
  if (!id) {
    return (
      <div id="mainBody">
        <div className="error-message">
          Error: No artwork ID provided
        </div>
        <div className="entryNavigation">
          <a href="/catalogue" className="backToWorks">
            Back to Catalogue
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div id="mainBody">
        <div className="loading">
          Loading artwork...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="mainBody">
        <div className="error-message">
          Error loading artwork: {error}
        </div>
        <div className="entryNavigation">
          <a href="/catalogue" className="backToWorks">
            Back to Catalogue
          </a>
        </div>
      </div>
    );
  }

  // Find the image in the R2 context
  const decodedId = decodeURIComponent(id);
  let imageData;

  // Check if the ID is numeric (from carousel index)
  if (/^\d+$/.test(decodedId)) {
    const index = parseInt(decodedId, 10) - 1; // Convert to zero-based index
    if (index >= 0 && index < images.length) {
      imageData = images[index];
    }
  } else {
    // Find by ID
    imageData = images.find(img => img.id === decodedId);
  }

  if (!imageData) {
    return (
      <div id="mainBody">
        <div className="error-message">
          Artwork not found: {id}
        </div>
        <div className="entryNavigation">
          <a href="/catalogue" className="backToWorks">
            Back to Catalogue
          </a>
        </div>
      </div>
    );
  }

  // Parse filename details
  const { catalogNumber, title, artist, size } = parseFilename(imageData.url);

  // Create artwork object
  const artwork: Artwork = {
    id: /^\d+$/.test(decodedId) ? parseInt(decodedId) : 0,
    title: title,
    date: '',
    medium: '',
    dimensions: '',
    location: '',
    catalogueNumber: catalogNumber,
    artist: artist,
    size: size,
    imageUrl: imageData.url
  };

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
                    {artwork.size && (
                      <div className="entryAttribute">
                        <div className="attributeLabel">Size:</div>
                        <div className="attributeValue">{artwork.size}mm</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="entryImageContainer">
            <ZoomableImage
              src={artwork.imageUrl}
              alt={artwork.title}
              width={1000}
              height={1200}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 