'use client';

import React from 'react';
import Link from 'next/link';
import '../styles/login.css';

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login to Better Badges</h1>
        <p>Access the exclusive collection of vintage badges and memorabilia.</p>
        
        <div className="login-buttons">
          {/* Auth0 login link - redirects to Auth0 Universal Login page */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/login" className="login-submit-button">
            Login with Auth0
          </a>
          
          {/* Google login with Auth0 */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a 
            href="/api/auth/login?connection=google-oauth2" 
            className="login-google-button"
          >
            <span className="google-icon">G</span>
            Login with Google
          </a>
          
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