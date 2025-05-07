'use client';

import Image from "next/image";
import Link from "next/link";
import { useR2Images } from "@/context/R2Context";
import { parseFilename } from "@/app/utils/filename-utils";
import { useEffect, useState } from "react";

// Define the SeriesPageClient props interface
interface SeriesPageClientProps {
  series: {
    id: string;
    title: string;
    description: string;
    link: string;
  };
}

export default function SeriesPageClient({ series }: SeriesPageClientProps) {
  const { images: r2Images } = useR2Images();
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [timestamp, setTimestamp] = useState(Date.now());

  // Force rerender on component mount and when r2Images changes
  useEffect(() => {
    // Get the exact prefix to match for this series
    // For example: A-series -> A, AAA-series -> AAA, B-series -> B, BBA-series -> BBA
    const seriesPrefix = series.title.split('-')[0].trim();
    
    // Find the first matching image for this series
    const found = r2Images.find(img => {
      const { catalogNumber } = parseFilename(img.url);
      // Match the catalog prefix exactly
      return catalogNumber.startsWith(seriesPrefix);
    });

    // Update image URL if found
    if (found) {
      setImageUrl(found.url);
    }

    setTimestamp(Date.now());
  }, [r2Images, series.title]);

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
          
          {/* Placeholder for future catalog entries or other content */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>Catalog Entries</h3>
            <p>The catalog entries for this series will be displayed here.</p>
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