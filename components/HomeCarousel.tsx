'use client';

import React from 'react';
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
  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "linear",
    adaptiveHeight: false
  };

  return (
    <div id="homepage">
      <div id="homepageCarouselWrapper" className="home-carousel-container">
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
                    height: 'auto',
                    maxHeight: '600px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    backgroundColor: '#f0f0f0'
                  }}
                  priority={index === 0}
                />
                <div className="homepageCarouseCaption">{slide.caption}</div>
              </div>
            </div>
          ))}
        </Slider>
        
        <div id="homepageCarouselCallout" className="show">
          <Link href="/catalogue/">
            Browse the Better Badges collection, featuring iconic punk and post-punk era badges, pins and memorabilia.
          </Link>
        </div>
      </div>
    </div>
  );
} 