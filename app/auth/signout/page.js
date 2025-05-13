'use client';

import { useEffect } from 'react';
import { useAuth } from '../useAuth';

export default function SignOut() {
  const { logout } = useAuth();
  
  // Trigger logout on page load
  useEffect(() => {
    logout();
  }, [logout]);
  
  return (
    <div className="flex h-screen items-center justify-center" style={{ fontFamily: 'Helvetica, sans-serif' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>Signing out...</p>
      </div>
    </div>
  );
} 