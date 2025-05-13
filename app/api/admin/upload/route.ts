import { NextResponse } from 'next/server';

// Configure for static export
export const dynamic = 'force-static';

// For static export, this endpoint just returns instructions
export async function GET() {
  return NextResponse.json({
    message: "For static export, uploads are handled directly by the client-side code",
    status: "success"
  });
}

// For static export, we can't handle POST requests server-side
export async function POST() {
  return NextResponse.json({
    error: "In static export mode, uploads are handled directly by client-side code",
    status: "error"
  }, { status: 501 });
} 