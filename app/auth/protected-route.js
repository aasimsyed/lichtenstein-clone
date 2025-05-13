'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

// Protected route component that redirects unauthenticated users
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ fontFamily: 'Helvetica, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return children;
  }

  // Don't render anything while redirecting
  return null;
} 