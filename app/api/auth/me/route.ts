import { NextResponse } from 'next/server';

// Configure for static export
export const dynamic = 'force-static';

// This is a placeholder implementation for the Auth0 user check
// In a real implementation, you would verify the Auth0 session/token
export async function GET() {
  try {
    // In a real implementation, this would verify the Auth0 user's session
    // For now, we'll return as authenticated for testing purposes
    
    // Mock authenticated user for development
    const mockAuthenticatedUser = {
      isAuthenticated: true,
      user: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }
    };
    
    return NextResponse.json(mockAuthenticatedUser);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return NextResponse.json(
      { 
        isAuthenticated: false,
        error: 'Failed to verify authentication'
      },
      { status: 500 }
    );
  }
} 