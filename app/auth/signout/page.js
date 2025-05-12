'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    // Handle sign out on page load
    const handleSignOut = async () => {
      try {
        await signOut({ callbackUrl: '/' });
        setIsSigningOut(false);
      } catch (error) {
        console.error('Error signing out:', error);
        setIsSigningOut(false);
      }
    };

    handleSignOut();
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Signing Out</h1>
        {isSigningOut ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-700">You are being signed out...</p>
          </div>
        ) : (
          <p className="text-gray-700">You have been signed out successfully.</p>
        )}
      </div>
    </div>
  );
} 