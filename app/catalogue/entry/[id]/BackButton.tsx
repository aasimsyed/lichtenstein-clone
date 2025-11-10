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
        marginTop: '0',
        marginLeft: '10px',
        color: '#333333',
        backgroundColor: '#f0f0f0',
        border: '1px solid #dddddd',
        fontWeight: 500,
        cursor: 'pointer',
        textDecoration: 'none',
        borderRadius: '3px',
        position: 'absolute',
        top: '120px',
        left: '10px',
        zIndex: 10
      }}
    >
      <span>← Back to Works</span>
    </a>
  );
} 