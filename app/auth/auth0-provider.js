'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { getAuth0Config, getEnv } from '../utils/env';

// Auth0Provider wrapper with navigation handling
export default function Auth0ProviderWithNavigate({ children }) {
  const router = useRouter();
  
  // Log environment status on component mount
  useEffect(() => {
    // Only log in development to avoid exposing sensitive info
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth0 Config:', {
        domain: getEnv('NEXT_PUBLIC_AUTH0_DOMAIN'),
        clientId: getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID'),
        origin: typeof window !== 'undefined' ? window.location.origin : null,
        env: process.env.NODE_ENV
      });
    }
  }, []);
  
  // Handle auth completion
  const onRedirectCallback = (appState) => {
    router.push(appState?.returnTo || '/admin');
  };
  
  // Get Auth0 credentials from environment variables using our utility
  const { domain, clientId, redirectUri } = getAuth0Config();
  
  if (!(domain && clientId && redirectUri)) {
    console.error('Auth0 configuration missing:', { domain, clientId, redirectUri });
    
    // Display a more informative message for debugging
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #f88', margin: '10px', borderRadius: '4px' }}>
        <h3>Auth0 Configuration Missing</h3>
        <p>The following configuration values are required but missing:</p>
        <ul>
          <li>NEXT_PUBLIC_AUTH0_DOMAIN: {domain || '❌ Missing'}</li>
          <li>NEXT_PUBLIC_AUTH0_CLIENT_ID: {clientId || '❌ Missing'}</li>
          <li>redirectUri: {redirectUri || '❌ Missing'}</li>
        </ul>
        <p>Please make sure these environment variables are set in your .env.local file.</p>
        <div>
          <p><strong>DEBUG:</strong> NODE_ENV: {getEnv('NODE_ENV')}</p>
          <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
          <h4>Troubleshooting Steps:</h4>
          <ol>
            <li>Ensure your .env.local file has the correct Auth0 variables</li>
            <li>Restart the development server</li>
            <li>Check the debug page at <Link href="/debug">/debug</Link> to see environment variable status</li>
            <li>Make sure your Auth0 application is correctly configured</li>
          </ol>
        </div>
        
        <div style={{ marginTop: '10px' }}>{children}</div>
      </div>
    );
  }
  
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
} 