'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

// Custom hook to provide authentication functionality
export function useAuth() {
  const {
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();
  
  // Handle login with optional return URL
  const login = useCallback((returnTo = window.location.pathname) => {
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
  };
} 