'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GridItemProps {
  imageUrl: string;
  title: string;
  description: string;
  link: string;
}

const gridItems: GridItemProps[] = [
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/RL_3173_WEB_s.jpeg",
    title: "Guide to the Catalogue",
    description: "Read about the scope of this catalogue and the organization of artwork entries.",
    link: "/resources/?Guide+to+the+Catalogue"
  },
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/Homepromo-CorlettCR.jpg",
    title: "Corlett Catalogue Raisonné of the Prints of Roy Lichtenstein",
    description: "Explore the 2002 Mary Lee Corlett Catalogue Raisonné in a revised digital version.",
    link: "/resources/?Corlett+CR"
  },
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/Homepromo-Works-Museum.jpg",
    title: "Works in Museums",
    description: "Search institutions worldwide for Lichtenstein works in their collections.",
    link: "/collections/"
  },
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/RL_0256_WEB.jpeg",
    title: "Unlocated Works",
    description: "Browse unlocated artworks and access the Collector's Submission Form.",
    link: "/resources/?Unlocated+Works"
  },
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/Homepromo-Other-Resources.jpg",
    title: "Other Resources",
    description: "Find further information on the artist's studio practice and his oeuvre.",
    link: "/resources/?Other+Resources"
  },
  {
    imageUrl: "https://cdn.panopticoncr.com/roylic001/supplemental_files/images_lg/RL_0443_WEB_s.jpeg",
    title: "Rights and Reproductions",
    description: "Inquire about copyright and the use of images of Lichtenstein and his artworks.",
    link: "/section/?id=Rights+Reproductions"
  }
];

export default function BottomGrid() {
  return (
    <div id="homepageBottomGrid">
      {gridItems.map((item, index) => (
        <Link href={item.link} key={index} className="item">
          <div className="left">
            <Image 
              src={item.imageUrl} 
              alt={item.title}
              width={120}
              height={120}
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="right">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
} 