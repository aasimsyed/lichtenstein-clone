import { NextResponse } from "next/server";

// Force static export compatibility
export const dynamic = 'force-static';

// Mock implementation for Google sign-in
export async function POST() {
  // In a static export, we would normally redirect to Google OAuth
  // Instead, we return a mock response for the static build
  
  // Return a response that the client side can handle
  return NextResponse.json({
    url: "/auth/signin?error=StaticBuildMode",
  });
} 