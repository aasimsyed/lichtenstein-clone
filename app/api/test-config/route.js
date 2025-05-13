import { NextResponse } from 'next/server';

// Force dynamic to ensure this runs in real-time
export const dynamic = 'force-dynamic';

// API route to test configuration
export async function GET() {
  // Return environment variables and configuration for debugging
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    isStatic: process.env.NEXT_STATIC_EXPORT === 'true',
    isDevelopment: process.env.NODE_ENV === 'development',
    message: 'This API route is working in development mode',
  });
} 