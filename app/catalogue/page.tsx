'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import CatalogueContent with no SSR to avoid useSearchParams error
const CatalogueContent = dynamic(() => import('../../components/CatalogueContent'), {
  ssr: false,
});

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: '50px 0',
    fontSize: '16px'
  }}>
    <div>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        Loading catalogue...
      </div>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f3f3', 
        borderTop: '4px solid #333', 
        borderRadius: '50%',
        margin: '0 auto',
        animation: 'spin 1s linear infinite'
      }}></div>
    </div>
  </div>
);

export default function Catalogue() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CatalogueContent />
    </Suspense>
  );
} 