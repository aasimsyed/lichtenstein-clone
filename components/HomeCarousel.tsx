'use client';

import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import Image from 'next/image';
import '../app/styles/carousel.css';

interface SlideProps {
  imageUrl: string;
  caption: string;
  link: string;
}

const carouselSlides: SlideProps[] = [
  {
    imageUrl: '/images/homepage/Picture Joly Michael Williams.webp',
    caption: 'Joly and Michael Williams - Better Badges founders and pioneers of punk culture ephemera',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/bayley - punk badges.webp',
    caption: 'Punk badges collection - iconic pins from the late 70s and early 80s UK music scene',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/BBB055 BBB065 Paper Wayne County Fuck Off Stiff.webp',
    caption: 'Wayne County "Fuck Off" - Rare Stiff Records promotional badges and paper ephemera',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/BBB148 Paper.webp',
    caption: 'Original paper flyers and promotional materials from the punk era',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/25MM_1451.webp',
    caption: 'Classic 25mm badges from the Better Badges collection',
    link: '/catalogue/'
  }
];

export default function HomeCarousel() {
  // We keep the isMobile state for future use even though it's currently only
  // used in media queries. This is intentional as we might need responsive behavior later.
  const [isMobile, setIsMobile] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Function to detect mobile view and set state
      const checkIfMobile = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        setShowArrows(mobile); // Only show arrows on mobile
      };

      // Initial check
      checkIfMobile();

      // Add resize listener
      window.addEventListener('resize', checkIfMobile);

      // Cleanup
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }
  }, []);

  const handleImageLoad = (index: number) => {
    if (!loadedImages.includes(index)) {
      setLoadedImages(prev => [...prev, index]);
    }
  };

  const settings = {
    dots: true,
    arrows: showArrows, // Control arrows based on screen size
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "ease-out",
    fade: true,
    adaptiveHeight: true,
    dotsClass: "carousel-dots", // Updated class name to match CSS
    appendDots: (dots: React.ReactNode) => (
      <div className="dots-container">
        <ul style={{ margin: "0px" }}>{dots}</ul>
      </div>
    ),
    customPaging: function(i: number) {
      return (
        <button
          aria-label={`Go to slide ${i + 1}`}
          className="carousel-dot-button"
        />
      );
    }
  };

  // Simple callout content
  const calloutText = "Browse the Better Badges collection, featuring iconic punk and post-punk era badges, pins and memorabilia.";

  const carouselWrapperStyle = {
    marginTop: isMobile ? '30px' : '0'
  };

  return (
    <div className="carousel-outer-container">
      <div 
        id="homepageCarouselWrapper" 
        className="home-carousel-container" 
        style={carouselWrapperStyle}
      >
        <Slider {...settings}>
          {carouselSlides.map((slide, index) => (
            <div key={index} className="homepageCarouselDiv">
              <div className="image-wrapper">
                <Image 
                  src={slide.imageUrl} 
                  alt={slide.caption}
                  width={1200}
                  height={600}
                  onLoad={() => handleImageLoad(index)}
                  className={`carousel-image ${loadedImages.includes(index) ? 'loaded' : ''}`}
                  priority={index === 0}
                  unoptimized={true}
                />
              </div>
              {/* Caption moved outside the image-wrapper to be below the image */}
              <div className="homepageCarouselCaption">
                {slide.caption}
              </div>
            </div>
          ))}
        </Slider>
        
        {/* Overlay callout on top of everything */}
        <div className={`callout-container ${isMobile ? 'mobile' : ''}`}>
          <Link href="/catalogue/" className="callout-link">
            {calloutText}
          </Link>
        </div>
      </div>
    </div>
  );
} 