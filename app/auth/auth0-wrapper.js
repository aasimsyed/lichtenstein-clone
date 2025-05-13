'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Auth0Provider to avoid SSR issues
const Auth0ProviderWithNavigate = dynamic(
  () => import('./auth0-provider'),
  { ssr: false }
);

export default function Auth0Wrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or loading state until client-side rendering is ready
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <Auth0ProviderWithNavigate>
      {children}
    </Auth0ProviderWithNavigate>
  );
} 