'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import React from 'react';

// Auth0Provider wrapper with navigation handling
export default function Auth0ProviderWithNavigate({ children }) {
  const router = useRouter();
  
  // Handle auth completion
  const onRedirectCallback = (appState) => {
    router.push(appState?.returnTo || '/admin');
  };
  
  // Get Auth0 credentials from environment variables
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const redirectUri = typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '';
  
  if (!(domain && clientId && redirectUri)) {
    return <div>Loading...</div>;
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