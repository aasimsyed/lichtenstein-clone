'use client';

import React, { useMemo } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import SmoothImage from '../app/components/SmoothImage';
import { useR2Images } from '../context/R2Context';
import { parseFilename } from '../app/utils/filename-utils';

export default function SelectionsCarousel() {
  // Get images from R2 context
  const { images, loading } = useR2Images();

  // Select random images from the available R2 images
  const selections = useMemo(() => {
    if (!images || images.length === 0) {
      return [];
    }
    
    // Shuffle array to get random selections
    const shuffled = [...images].sort(() => 0.5 - Math.random());
    // Take up to 10 images or all if less than 10
    return shuffled.slice(0, Math.min(10, shuffled.length));
  }, [images]);

  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    autoplay: false,
    lazyLoad: "ondemand" as const,
    responsive: [
      {
        breakpoint: 1024,
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

  // Don't render anything if still loading or no images
  if (loading || selections.length === 0) {
    return null;
  }

  // Function to get proper artwork ID for linking
  const getArtworkId = (image) => {
    // Find the index of this image in the original images array
    const originalIndex = images.findIndex(img => img.id === image.id);
    // Return the index + 1 as that's how the entry page finds images
    return originalIndex >= 0 ? originalIndex + 1 : 1;
  };

  return (
    <div className="selections-carousel-container">
      <h2 className="selections-title">Featured Badges</h2>
      <div className="selections-carousel">
        <Slider {...settings}>
          {selections.map((image, index) => {
            const { catalogNumber, title, artist, size } = parseFilename(image.url);
            const artworkId = getArtworkId(image);
            return (
              <div key={index} className="carousel-slide">
                <div className="slide-inner">
                  <Link href={`/catalogue/entry/${artworkId}`} className="artwork-link">
                    <div className="image-container">
                      <SmoothImage 
                        src={image.url} 
                        alt={title} 
                        width={200}
                        height={200}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'contain',
                          backgroundColor: 'transparent'
                        }}
                        quality={85}
                        loadingColor="#f0f0f0"
                      />
                    </div>
                    <div className="info">
                      <h3 className="artwork-title">{title}</h3>
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