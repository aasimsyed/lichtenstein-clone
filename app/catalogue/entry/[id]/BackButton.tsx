'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Client component for navigation
export default function BackButton() {
  const router = useRouter();
  
  return (
    <a 
      href="/catalogue"
      className="backToWorks-custom"
      onClick={(e) => {
        e.preventDefault();
        router.push('/catalogue');
      }}
      style={{
        display: 'inline-block',
        padding: '8px 16px',
        marginBottom: '20px',
        color: 'white',
        backgroundColor: '#333333',
        border: 'none',
        fontWeight: 500,
        cursor: 'pointer',
        textDecoration: 'none'
      }}
    >
      <span style={{ color: 'white' }}>Back to Works</span>
    </a>
  );
} 