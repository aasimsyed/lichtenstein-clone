'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { getEnv } from '../utils/env';

// Custom hook to provide authentication functionality
export function useAuth() {
  const {
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    isLoading,
    getAccessTokenSilently,
    error,
  } = useAuth0();
  
  // Handle login with optional return URL
  const login = useCallback((returnTo = window.location.pathname) => {
    // Check if Auth0 is properly configured
    const domain = getEnv('NEXT_PUBLIC_AUTH0_DOMAIN');
    const clientId = getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID');
    
    if (!domain || !clientId) {
      console.error('Auth0 configuration missing. Domain or Client ID not set.');
      alert('Authentication is not configured properly. Please contact the administrator.');
      return;
    }
    
    loginWithRedirect({
      appState: { returnTo },
    });
  }, [loginWithRedirect]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }, [logout]);
  
  // Get user's token for API calls
  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  }, [getAccessTokenSilently]);
  
  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout: handleLogout,
    getToken,
    error,
  };
} 