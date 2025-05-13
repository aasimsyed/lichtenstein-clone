// For static export, we need a middleware that doesn't rely on dynamic features
// This is a minimal middleware that will be ignored in static export mode

export const config = {
  matcher: [],
};

export function middleware() {
  // This function is intentionally empty
  // It's only here to satisfy the Next.js requirement
  // but won't run in static export mode
} 