'use client';

import Image from "next/image";
import Link from "next/link";
import { useR2Images } from "@/context/R2Context";
import { parseFilename } from "@/app/utils/filename-utils";
import { useEffect, useState, useMemo } from "react";
import "../../app/styles/components.css";

// Define the SeriesPageClient props interface
interface SeriesPageClientProps {
  series: {
    id: string;
    title: string;
    description: string;
    link: string;
  };
}

interface ProcessedArtwork {
  id: string;
  url: string;
  title: string;
  catalogueNumber: string;
  artist: string;
  size: string;
}

export default function SeriesPageClient({ series }: SeriesPageClientProps) {
  const { images: r2Images } = useR2Images();
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [timestamp, setTimestamp] = useState(Date.now());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());

  // Get the exact prefix to match for this series
  const seriesPrefix = series.title.split('-')[0].trim();

  // Filter and process images for this series
  const seriesArtworks = useMemo(() => {
    return r2Images
      .map(img => {
        const metadata = parseFilename(img.id);
        return {
          id: img.id,
          url: img.url,
          title: metadata.title || 'Untitled',
          catalogueNumber: metadata.catalogNumber || 'N/A',
          artist: metadata.artist || 'Unknown',
          size: metadata.size || 'Unknown'
        };
      })
      .filter(artwork => {
        // Match the catalog prefix exactly
        return artwork.catalogueNumber.startsWith(seriesPrefix);
      })
      .sort((a, b) => {
        // Sort by catalog number
        const numA = parseInt(a.catalogueNumber.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.catalogueNumber.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
  }, [r2Images, seriesPrefix]);

  // Force rerender on component mount and when r2Images changes
  useEffect(() => {
    // Find the first matching image for hero
    if (seriesArtworks.length > 0) {
      setImageUrl(seriesArtworks[0].url);
    }

    setTimestamp(Date.now());
  }, [seriesArtworks]);

  return (
    <div className="series-page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{series.title}</h1>
      
      <div className="series-content" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="series-header" style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ 
            width: '200px', 
            height: '200px',
            margin: '0 auto 20px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            borderRadius: '4px',
            backgroundColor: '#f8f8f8',
          }}>
            <Image
              src={imageUrl}
              alt={series.title}
              width={180}
              height={180}
              style={{
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              priority
              quality={80}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              unoptimized={true}
              key={`series-image-${timestamp}`}
            />
          </div>
          <p style={{ fontSize: '16px', lineHeight: '1.6', maxWidth: '800px', textAlign: 'center' }}>
            {series.description}
          </p>
        </div>
        
        <div className="series-details" style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            About {series.title}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            This page contains detailed information about the {series.title}. 
            Browse through the catalog entries below to learn more about each piece.
          </p>
          
          {/* Series badges grid */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>
              Catalog Entries ({seriesArtworks.length})
            </h3>
            
            {seriesArtworks.length === 0 ? (
              <p>No badges found for this series.</p>
            ) : (
              <div className="catWorksCont" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px',
                marginTop: '20px'
              }}>
                {seriesArtworks.map((artwork, index) => (
                  <article
                    key={`${artwork.id}-${index}`}
                    className="item"
                  >
                    <a href={`/catalogue/artwork?id=${encodeURIComponent(artwork.id)}`} title={artwork.title}>
                      <div 
                        className="image catalogue-image-container" 
                        data-image-url={artwork.url}
                        style={{ position: 'relative', backgroundColor: 'transparent', minHeight: '200px' }}
                      >
                        {!loadedImages.has(artwork.url) && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              border: '3px solid #e0e0e0',
                              borderTopColor: '#999',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          </div>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={artwork.url}
                          alt={artwork.title}
                          width={400}
                          height={480}
                          decoding="async"
                          style={{
                            opacity: loadedImages.has(artwork.url) ? 1 : 0,
                            transition: 'opacity 0.4s ease-in-out',
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover'
                          }}
                          onLoad={() => {
                            setLoadedImages(prev => {
                              const newSet = new Set(prev);
                              newSet.add(artwork.url);
                              return newSet;
                            });
                          }}
                          onError={() => {
                            setLoadedImages(prev => {
                              const newSet = new Set(prev);
                              newSet.add(artwork.url);
                              return newSet;
                            });
                          }}
                        />
                      </div>
                      <div className="item_catDetails">
                        <div className="item_artist" style={{ fontWeight: 700 }}>{artwork.artist}</div>
                        <div className="item_title"><em>{artwork.title}</em></div>
                        <div className="item_catnum">{artwork.catalogueNumber}, {artwork.size}</div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link 
          href="/" 
          style={{ 
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#333',
            fontWeight: 500,
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 