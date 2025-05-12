import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({ req: request });
  
  if (!token) {
    // Not signed in
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }
  
  return NextResponse.next();
} 