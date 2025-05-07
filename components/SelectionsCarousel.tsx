'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import SmoothImage from '../app/components/SmoothImage';
import { useR2Images } from '../context/R2Context';
import { parseFilename } from '../app/utils/filename-utils';

export default function SelectionsCarousel() {
  // Get images from R2 context
  const { images, loading } = useR2Images();
  const [imagesPreloaded, setImagesPreloaded] = useState({});
  
  // Select random images from the available R2 images
  const selections = useMemo(() => {
    if (!images || images.length === 0) {
      return [];
    }
    // Filter out images with catalogNumber starting with 'AD'
    const filtered = images.filter(img => {
      const { catalogNumber } = parseFilename(img.url);
      return !catalogNumber.startsWith('AD');
    });
    // Shuffle array to get random selections
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    // Take up to 12 images or all if less than 12
    return shuffled.slice(0, Math.min(18, shuffled.length));
  }, [images]);

  // Preload images
  useEffect(() => {
    if (selections.length === 0) return;
    
    // Preload all images at once
    selections.forEach(image => {
      const img = new Image();
      img.onload = () => {
        setImagesPreloaded(prev => ({
          ...prev,
          [image.url]: true
        }));
      };
      img.src = image.url;
    });
  }, [selections]);

  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    autoplay: false,
    lazyLoad: "progressive" as const,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  // Function to get proper artwork ID for linking
  const getArtworkId = (image) => {
    // Always use the numeric ID (index+1) for consistency with static export
    const originalIndex = images.findIndex(img => img.id === image.id);
    return originalIndex >= 0 ? originalIndex + 1 : 1;
  };
  
  // Helper function to clean titles by removing 'webp' suffix
  const cleanTitle = (title) => {
    return title.replace(/\s*webp\s*$/i, '').trim();
  };

  // Don't render anything if still loading or no images
  if (loading || selections.length === 0) {
    return (
      <div className="selections-carousel-container">
        <h2 className="selections-title">Featured Badges</h2>
        <div className="selections-carousel" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading images...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="selections-carousel-container">
      <h2 className="selections-title">Featured Badges</h2>
      <div className="selections-carousel" style={{ padding: '10px 0' }}>
        <Slider {...settings}>
          {selections.map((image, index) => {
            const { catalogNumber, title, artist, size } = parseFilename(image.url);
            const artworkId = getArtworkId(image);
            const imagePreloaded = imagesPreloaded[image.url];
            return (
              <div key={index} className="carousel-slide">
                <div className="slide-inner" style={{ margin: '0 8px' }}>
                  <Link href={`/catalogue/artwork?id=${encodeURIComponent(artworkId)}`} className="artwork-link">
                    <div className="image-container" style={{
                      position: 'relative',
                      background: 'white',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #ddd'
                    }}>
                      {!imagePreloaded && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                          backgroundColor: 'white'
                        }}>
                          <img 
                            src="/placeholder.svg" 
                            alt="Loading" 
                            width={100} 
                            height={100}
                            style={{ opacity: 0.8 }}
                          />
                        </div>
                      )}
                      <SmoothImage 
                        src={image.url} 
                        alt={cleanTitle(title)} 
                        width={150}
                        height={150}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'contain',
                          backgroundColor: 'white',
                          position: 'relative',
                          zIndex: 2,
                          opacity: imagePreloaded ? 1 : 0,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                        quality={70}
                        loadingColor="#f0f0f0"
                        unoptimized={true}
                        lazyBoundary="500px"
                        placeholder="blur"
                        blurDataURL="/placeholder.svg"
                        preload={index < 6} // Preload first 6 images
                        fadeIn={true}
                        preventRerender={true}
                      />
                    </div>
                    <div className="info">
                      <h3 className="artwork-title">{cleanTitle(title)}</h3>
                      <p className="artwork-date">{artist}</p>
                      <p className="artwork-rlcr">{catalogNumber}, {size}</p>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>

      {/* Additional styles to fix dot navigation overlap */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Fix for dot navigation overlapping with info */
          .selections-carousel .slick-list {
            padding-bottom: 10px !important;
            margin-bottom: 10px !important;
          }
          
          /* Info text container needs spacing and z-index */
          .selections-carousel .info {
            margin-bottom: 10px !important;
            position: relative !important;
            z-index: 5 !important;
          }
          
          /* Push dots down */
          .selections-carousel .slick-dots {
            bottom: -20px !important;
            position: absolute !important;
          }
          
          /* Add background to ensure dots are more visible */
          .selections-carousel .slick-dots li button {
            background: #888 !important;
            width: 10px !important;
            height: 10px !important;
            border-radius: 50% !important;
          }
          
          /* Container needs to account for dot positioning */
          .selections-carousel-container {
            padding-bottom: 20px !important;
            margin-bottom: 20px !important;
            overflow: visible !important;
            position: relative !important;
            z-index: 1 !important;
            clear: both !important;
          }
          
          /* Ensure selections title is visible above the carousel */
          .selections-title {
            display: block !important;
            position: relative !important;
            z-index: 5 !important;
            padding-top: 10px !important;
            margin-top: 0 !important;
            font-weight: 500 !important;
            text-align: center !important;
            font-size: 22px !important;
            clear: both !important;
            width: 100% !important;
          }
          
          /* Force the callout to be properly positioned */
          .callout-container {
            margin-bottom: 50px !important;
            position: relative !important;
            display: block !important;
            clear: both !important;
            width: 100% !important;
            float: none !important;
          }
        }
      `}</style>
    </div>
  );
} 