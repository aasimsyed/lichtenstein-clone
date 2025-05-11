import { NextRequest, NextResponse } from 'next/server';

// Configure for static export
export const dynamic = 'force-static';

// Placeholder login handler for static export
export async function GET(request: NextRequest) {
  // For static export, we need to handle this differently
  // In a real Auth0 setup with dynamic API, this would redirect to Auth0
  
  // For now, we'll just redirect to /admin with a mock token
  const url = new URL('/admin', request.url);
  
  return NextResponse.redirect(url);
} 