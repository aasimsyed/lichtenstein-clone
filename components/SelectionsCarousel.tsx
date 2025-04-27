'use client';

import React, { useMemo } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import Image from 'next/image';
import { useCloudinaryImages } from '../context/CloudinaryContext';
import { parseFilename } from '../app/utils/filename-utils';

export default function SelectionsCarousel() {
  // Get images from Cloudinary context
  const { images, loading } = useCloudinaryImages();

  // Select random images from the available Cloudinary images
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
                      <Image 
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
    </div>
  );
} 