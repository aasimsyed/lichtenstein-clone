'use client';

import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
import Image from 'next/image';

interface SlideProps {
  imageUrl: string;
  caption: string;
  link: string;
}

const carouselSlides: SlideProps[] = [
  {
    imageUrl: '/images/homepage/Picture Joly Michael Williams.jpg',
    caption: 'Joly and Michael Williams - Better Badges founders and pioneers of punk culture ephemera',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/bayley - punk badges.jpg',
    caption: 'Punk badges collection - iconic pins from the late 70s and early 80s UK music scene',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/BBB055 BBB065 Paper Wayne County Fuck Off Stiff.jpg',
    caption: 'Wayne County "Fuck Off" - Rare Stiff Records promotional badges and paper ephemera',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/BBB148 Paper.jpg',
    caption: 'Original paper flyers and promotional materials from the punk era',
    link: '/catalogue/'
  },
  {
    imageUrl: '/images/homepage/25MM_1451.jpg',
    caption: 'Classic 25mm badges from the Better Badges collection',
    link: '/catalogue/'
  }
];

export default function HomeCarousel() {
  // We keep the isMobile state for future use even though it's currently only
  // used in media queries. This is intentional as we might need responsive behavior later.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  
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

  const settings = {
    dots: true,
    arrows: showArrows, // Control arrows based on screen size
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "linear",
    adaptiveHeight: true,
    dotsClass: "slick-dots custom-dots-container",
    appendDots: (dots: React.ReactNode) => (
      <div
        style={{
          position: 'absolute',
          bottom: '-40px', // Moved down below the image and caption
          left: '0',
          right: '0',
          display: 'flex !important',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px 0',
          backgroundColor: 'rgba(255,255,255,0.7)',
          zIndex: 10
        }}
      >
        {dots}
      </div>
    ),
    customPaging: function(i: number) {
      return (
        <button
          aria-label={`Go to slide ${i + 1}`}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#888',
            border: '1px solid #666',
            display: 'block',
            padding: 0,
            margin: '0 5px',
            boxShadow: '0 0 2px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer'
          }}
        />
      );
    }
  };

  // Simple callout content
  const calloutText = "Browse the Better Badges collection, featuring iconic punk and post-punk era badges, pins and memorabilia.";

  return (
    <div id="homepage">
      <div 
        id="homepageCarouselWrapper" 
        className="home-carousel-container" 
        style={{ position: 'relative', paddingBottom: '150px', marginTop: isMobile ? '30px' : '0' }} // Increased padding
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
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                  priority={index === 0}
                />
              </div>
              <div className="homepageCarouseCaption" id={`caption-${index}`}>
                {slide.caption}
              </div>
            </div>
          ))}
        </Slider>
        
        {/* Overlay callout on top of everything */}
        <div className="callout-container" style={{ 
          position: 'absolute',
          top: isMobile ? 'auto' : 'calc(70% + 35px)',
          bottom: isMobile ? '10px' : 'auto',
          right: isMobile ? 0 : '0%',
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : '30%',
          zIndex: 20,
          backgroundColor: isMobile ? 'rgba(255, 235, 132, 0.95)' : 'rgba(255, 235, 132, 0.8)',
          padding: '15px 15px',
          textAlign: 'left',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          borderRadius: isMobile ? 0 : '4px'
        }}>
          <Link href="/catalogue/" className="callout-link">
            {calloutText}
          </Link>
        </div>
      </div>
      
      {/* Simple CSS overrides */}
      <style jsx global>{`
        .home-carousel-container {
          margin-bottom: 60px;
        }
        
        /* Fix caption display */
        .homepageCarouseCaption {
          position: relative !important;
          z-index: 25 !important; /* Ensure it's above other elements */
          display: block !important;
          margin-top: 10px !important;
          background: rgba(240, 240, 240, 0.8) !important;
          padding: 0px 20px !important;
          width: 100% !important;
          text-align: left !important;
          font-size: 13px !important;
          box-sizing: border-box !important;
        }
        
        /* Ensure there's space for the caption */
        .homepageCarouselDiv {
          overflow: visible !important;
          height: auto !important;
          padding-bottom: 10px !important;
        }
        
        .image-wrapper {
          height: 676px !important; /* Maintain image height */
          overflow: hidden !important;
        }
        
        .custom-dots-container {
          position: absolute !important;
          bottom: -40px !important;
          left: 0 !important;
          right: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 10px 0 !important;
          z-index: 10 !important;
          background-color: rgba(255,255,255,0.7) !important;
          width: 100% !important;
        }
        
        .custom-dots-container li {
          display: inline-block !important;
          margin: 0 5px !important;
        }
        
        .custom-dots-container li.slick-active button {
          background-color: #333 !important;
          transform: scale(1.2) !important;
        }
        
        /* Clean callout styling with no conflicting elements */
        .callout-container {
          position: absolute;
          z-index: 20;
          background-color: rgba(255, 235, 132, 0.8);
          padding: 15px;
          text-align: left;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
        }
        
        .callout-container:hover {
          background-color: rgba(255, 235, 132, 0.95);
        }
        
        .callout-link {
          color: #333;
          text-decoration: none;
          display: block;
          width: 100%;
          position: relative;
          font-size: 1.05em;
          line-height: 1.4;
        }
        
        /* Arrow icon for the link */
        .callout-link::after {
          content: "→";
          position: absolute;
          right: 0;
          bottom: -13px;
          font-size: 1.2em;
        }
        
        /* Responsiveness */
        @media (max-width: 768px) {
          /* Fixed layout for consistent positioning */
          #homepage #homepageCarouselWrapper {
            position: relative !important;
            min-height: 400px !important; /* Fixed minimum height for the entire carousel section */
            padding-bottom: 180px !important; /* Increased space for caption, dots and callout */
            margin-bottom: 30px !important;
          }
          
          /* Caption with fixed height to prevent layout shifts */
          .homepageCarouseCaption {
            min-height: 40px !important; /* Fixed height accommodating 2 lines */
            overflow: auto !important; /* Allow scrolling if needed */
            margin-top: 8px !important;
            padding: 8px 15px !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            background: rgba(240,240,240,0.9) !important;
            z-index: 50 !important;
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          
          /* Fixed positioning for callout */
          .callout-container {
            position: absolute !important;
            bottom: 10px !important;
            top: auto !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12px 15px !important;
            transform: none !important;
            z-index: 20 !important;
            display: block !important;
            border-radius: 0 !important;
          }
          
          /* Fixed positioning for dot navigation */
          .custom-dots-container {
            position: absolute !important;
            bottom: 70px !important; /* Fixed position from bottom */
            left: 0 !important;
            right: 0 !important;
            background-color: rgba(255, 255, 255, 0.9) !important;
            padding: 8px 0 !important;
            z-index: 30 !important;
            width: 100% !important;
          }
          
          /* Consistent container spacing */
          .home-carousel-container {
            overflow: visible !important;
            margin-bottom: 30px !important;
          }
          
          /* Ensure link is styled properly */
          .callout-link {
            font-size: 0.9em;
            line-height: 1.3;
          }
          
          /* Fix image wrapper height */
          .image-wrapper {
            height: 234px !important; /* Match mobile image height */
            overflow: hidden !important;
            margin-bottom: 0 !important;
          }
          
          /* Proper carousel div setup */
          .homepageCarouselDiv {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding-bottom: 0 !important; /* Remove padding to prevent shifts */
            margin-bottom: 0 !important;
          }
          
          /* Reduce whitespace between carousel and Featured Badges section */
          .selections-carousel-container {
            margin-top: 10px !important;
            padding-top: 0 !important;
          }
          
          /* Better spacing for title */
          .selections-title {
            margin-top: 0 !important;
            padding-top: 0 !important;
            margin-bottom: 15px !important;
          }
        }
        
        /* Add styling for the carousel arrows */
        .slick-prev, .slick-next {
          display: none !important; /* Hide arrows by default (desktop) */
          position: absolute !important;
          z-index: 15 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 30px !important;
          height: 30px !important;
          background-color: rgba(255, 255, 255, 0.7) !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .slick-prev {
          left: 15px !important;
        }
        
        .slick-next {
          right: 15px !important;
        }
        
        .slick-prev:before, .slick-next:before {
          font-size: 20px !important;
          opacity: 0.8 !important;
          color: #333 !important;
        }
        
        .slick-prev:hover, .slick-next:hover {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
        
        @media (max-width: 768px) {
          .slick-prev, .slick-next {
            display: flex !important; /* Show arrows on mobile */
          }
          
          .slick-prev {
            left: 10px !important;
          }
          
          .slick-next {
            right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
} 