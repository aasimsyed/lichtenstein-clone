import { NextResponse } from 'next/server';

// Configure for static export
export const dynamic = 'force-static';

// Generate static paths for this route
export function generateStaticParams() {
  return [{}]; // No dynamic parameters for this route
}

// Placeholder login handler for static export
export async function GET() {
  // For static export, we need to handle this differently
  // In a real Auth0 setup with dynamic API, this would redirect to Auth0
  
  // Return a JSON response instead of a redirect for static export
  return NextResponse.json({
    message: "This is a static mock of the auth login API",
    redirectTo: "/admin"
  });
} 