'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import SmoothImage from '../app/components/SmoothImage';
import { useR2Images } from '../context/R2Context';
import { parseFilename } from '../app/utils/filename-utils';
import '../app/styles/carousel.css';

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
          slidesToScroll: 3,
          arrows: false
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          arrows: false
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false
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
        <div className="selections-carousel loading-container">
          <div>Loading images...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="selections-carousel-container">
      <h2 className="selections-title">Featured Badges</h2>
      <div className="selections-carousel">
        <Slider {...settings}>
          {selections.map((image, index) => {
            const { catalogNumber, title, artist, size } = parseFilename(image.url);
            const artworkId = getArtworkId(image);
            const imagePreloaded = imagesPreloaded[image.url];
            return (
              <div key={index} className="carousel-slide">
                <div className="slide-inner">
                  <Link href={`/catalogue/artwork?id=${encodeURIComponent(artworkId)}`} className="artwork-link">
                    <div className="image-container">
                      {!imagePreloaded && (
                        <div className="placeholder-container">
                          <img 
                            src="/placeholder.svg" 
                            alt="Loading" 
                            width={100} 
                            height={100}
                            className="placeholder-image"
                          />
                        </div>
                      )}
                      <SmoothImage 
                        src={image.url} 
                        alt={cleanTitle(title)} 
                        width={150}
                        height={150}
                        className={`carousel-image ${imagePreloaded ? 'loaded' : 'loading'}`}
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
                      <p className="artwork-artist">{cleanTitle(artist)}</p>
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