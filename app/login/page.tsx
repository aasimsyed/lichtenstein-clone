'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/useAuth';
import '../styles/login.css';

export default function LoginPage() {
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useAuth();

  // Handle general Auth0 login
  const handleAuth0Login = () => {
    login('/admin'); // Redirect to admin after login
  };

  // Handle Google-specific login with Auth0
  const handleGoogleLogin = () => {
    loginWithGoogle('/admin'); // Use the dedicated Google login function
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            <p style={{ marginTop: '1rem', fontFamily: 'Helvetica, sans-serif' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Already Logged In</h2>
            <p>You are already authenticated.</p>
            <Link href="/admin" className="login-submit-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Go to Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login to Better Badges</h1>
        <p>Access the exclusive collection of vintage badges and memorabilia.</p>
        
        <div className="login-buttons">
          {/* Auth0 login button - uses Auth0 Universal Login */}
          <button 
            onClick={handleAuth0Login}
            className="login-submit-button"
            type="button"
          >
            Login with Auth0
          </button>
          
          {/* Google login button with Auth0 */}
          <button 
            onClick={handleGoogleLogin}
            className="login-google-button"
            type="button"
          >
            <span className="google-icon">G</span>
            Login with Google
          </button>
          
          <div className="login-options">
            <Link href="/" className="back-button">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 