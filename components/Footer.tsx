'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h4>Better Badges: A Catalogue Raisonné</h4>
          <ul>
            <li><Link href="/resources/?Guide+to+the+Catalogue">Guide to the Catalogue</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <ul>
            <li><Link href="/resources/?Works+Outside+the+Catalogue">Works Outside the Catalogue</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <ul>
            <li><Link href="/section/?id=Rights+Reproductions">Rights & Reproductions</Link></li>
            <li><Link href="/section/?id=Archives">Archives</Link></li>
            <li><Link href="/resources/?Other+Resources">Other Resources</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
} 