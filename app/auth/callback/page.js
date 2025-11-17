'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export default function Callback() {
  const { isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();
  
  useEffect(() => {
    // Once auth is complete and not loading, redirect to dashboard or home
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Show loading indicator while auth is processing
  return (
    <div className="flex h-screen items-center justify-center" style={{ fontFamily: 'Helvetica, sans-serif' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>
          Completing authentication, please wait...
        </p>
      </div>
    </div>
  );
} 