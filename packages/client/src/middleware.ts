import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/', '/drive', '/chat'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the request is for a protected path
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = req.cookies.get('refreshToken')?.value;

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request
  return NextResponse.next();
}

// Limit matcher to only paths we care about
export const config = {
  matcher: ['/:path*'],
};
