'use client';

import SeriesGrid from "@/components/SeriesGrid";
import { catalogSeries } from "@/data/catalogSeries";
import { useR2Images } from "@/context/R2Context";
import { parseFilename } from "@/app/utils/filename-utils";
import { useEffect, useState } from "react";

export default function HomeSeriesGridClient() {
  const { images: r2Images } = useR2Images();
  const [timestamp, setTimestamp] = useState(Date.now());

  // Force rerender on component mount
  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  const seriesWithR2Images = catalogSeries.map(series => {
    // Get the exact prefix to match for each series
    // For example: A-series -> A, AAA-series -> AAA, B-series -> B, BBA-series -> BBA
    const seriesPrefix = series.title.split('-')[0].trim();
    
    // Find the first matching image for this series
    const found = r2Images.find(img => {
      const { catalogNumber } = parseFilename(img.url);
      // Match the catalog prefix exactly
      return catalogNumber.startsWith(seriesPrefix);
    });

    // Default placeholder image if no R2 image is found
    const defaultPlaceholder = "/placeholder.svg";

    return {
      ...series,
      imageUrl: found ? found.url : defaultPlaceholder,
    };
  });

  // Add key prop to force component re-rendering
  return (
    <div className="series-grid-wrapper" style={{ width: '100%', marginTop: '50px' }}>
      <SeriesGrid 
        items={seriesWithR2Images} 
        key={`series-grid-${timestamp}`} 
      />
    </div>
  );
} 