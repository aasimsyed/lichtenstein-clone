'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getEnv } from '../utils/env';

// Dynamically import Auth0Provider to avoid SSR issues
const Auth0ProviderWithNavigate = dynamic(
  () => import('./auth0-provider'),
  { ssr: false }
);

export default function Auth0Wrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  // Add environment variables debug check
  const [envStatus, setEnvStatus] = useState({
    domain: '(checking...)',
    clientId: '(checking...)',
    env: '(checking...)'
  });

  useEffect(() => {
    setMounted(true);
    // Check environment variables availability in client side
    setEnvStatus({
      domain: getEnv('NEXT_PUBLIC_AUTH0_DOMAIN') ? 'Available' : 'Missing',
      clientId: getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID') ? 'Available' : 'Missing',
      env: getEnv('NODE_ENV', 'unknown')
    });
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
    <>
      {/* Show debug info in production but hide it for most users */}
      {getEnv('NODE_ENV') === 'production' && 
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          fontSize: '10px', 
          padding: '5px', 
          background: '#f0f0f0', 
          border: '1px solid #ccc',
          zIndex: 1000,
          opacity: 0.7
        }}>
          AUTH_DOMAIN: {envStatus.domain}<br />
          AUTH_CLIENT_ID: {envStatus.clientId}<br />
          NODE_ENV: {envStatus.env}
        </div>
      }
      <Auth0ProviderWithNavigate>
        {children}
      </Auth0ProviderWithNavigate>
    </>
  );
} 