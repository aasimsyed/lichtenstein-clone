import { NextResponse } from "next/server";

// Force static export compatibility
export const dynamic = 'force-static';

export async function POST() {
  // Simply return a 200 status, ignoring any logging
  return NextResponse.json({ success: true });
} 