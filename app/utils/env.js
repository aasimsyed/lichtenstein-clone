/**
 * Utility functions for handling environment variables
 * This helps with client-side environment variables in static exports
 */

// Fallback values for development/testing - ONLY used if .env.local is missing
const fallbackValues = {
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-pits6x7daaksl8kp.us.auth0.com',
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'YPFdzB2T6YZvJeVdAD1Xx1tPox8Klx5b',
};

// Get an environment variable with fallback for static exports
export function getEnv(key, defaultValue = '') {
  // Try to get from process.env first
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Try to get from window.__ENV__ (could be injected at runtime by Cloudflare)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  
  // Try to get from fallback values
  if (fallbackValues[key]) {
    console.log(`Using fallback value for ${key}`);
    return fallbackValues[key];
  }
  
  // Return default value as last resort
  return defaultValue;
}

// Check if running in the browser
export const isBrowser = typeof window !== 'undefined';

// Check if running in production
export const isProduction = process.env.NODE_ENV === 'production';

// Get Auth0 configuration
export function getAuth0Config() {
  return {
    domain: getEnv('NEXT_PUBLIC_AUTH0_DOMAIN'),
    clientId: getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID'),
    redirectUri: isBrowser ? `${window.location.origin}/auth/callback` : '',
  };
} 