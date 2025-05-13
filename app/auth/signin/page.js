'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../useAuth';

// Create a component for sign-in content
function SignInContent() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ fontFamily: 'Helvetica, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const containerStyles = {
    fontFamily: 'Helvetica, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem 1rem',
    background: 'linear-gradient(to bottom right, #ebf5ff, #ffffff, #eef2ff)'
  };

  const headerContainerStyles = {
    textAlign: 'center',
    marginBottom: '50px',
    maxWidth: '80%'
  };

  const headerStyles = {
    fontSize: '54px',
    fontFamily: 'Helvetica, sans-serif',
    fontWeight: 800,
    color: '#333',
    marginBottom: '25px',
    letterSpacing: '-0.025em',
    lineHeight: 1.1
  };

  const subheaderStyles = {
    fontSize: '18px',
    fontFamily: 'Helvetica, sans-serif',
    fontWeight: 400,
    color: '#555',
    marginTop: '25px',
    lineHeight: 1.5,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto'
  };

  const cardStyles = {
    background: '#ffffff',
    padding: '40px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px'
  };
  
  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '14px 24px',
    borderRadius: '30px',
    backgroundColor: '#ffffff',
    color: '#444',
    fontFamily: 'Helvetica, sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    border: '1px solid #dadce0',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    minWidth: '240px'
  };

  const footerStyles = {
    marginTop: '35px',
    textAlign: 'center',
    fontFamily: 'Helvetica, sans-serif',
    fontSize: '16px',
    color: '#555',
    fontWeight: 500
  };

  return (
    <div style={containerStyles}>
      <div style={headerContainerStyles}>
        <h1 style={headerStyles}>Admin Access</h1>
        <p style={subheaderStyles}>
          Sign in with your authorized account
        </p>
      </div>

      <div style={cardStyles}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <button
            id="google-signin-button"
            onClick={() => login('/admin')}
            style={buttonStyles}
            type="button"
            aria-label="Sign in with Google"
          >
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span style={{ fontFamily: 'Helvetica, sans-serif' }}>Sign in with Google</span>
          </button>
        </div>
      </div>
      <div style={footerStyles}>
        <p>Admin access is restricted to authorized personnel only.</p>
      </div>
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center" style={{ fontFamily: 'Helvetica, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
} 