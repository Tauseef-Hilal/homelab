import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // List of paths protected by authentication
  const protectedPaths = ['/', '/drive', '/chat'];

  if (
    protectedPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    )
  ) {
    const token = req.cookies.get('refreshToken')?.value;
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// ⚠️ This must be a literal array for static analysis
export const config = {
  matcher: [
    '/', // exact match
    '/drive/:path*', // /drive and any subpath
    '/chat/:path*', // /chat and any subpath
  ],
};
