import { NextResponse } from "next/server";

// Force static export compatibility
export const dynamic = 'force-static';

// Return a mock session response
export async function GET() {
  return NextResponse.json({
    user: null,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
} 