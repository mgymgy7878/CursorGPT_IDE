import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Degraded mode: bypass complex middleware for critical paths
// TODO: Re-enable full middleware after root cause analysis

// Removed complex auth/guard logic temporarily for degraded mode
// TODO: Re-enable after root cause analysis

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Critical paths bypass (degraded mode)
  // API public endpoints, health checks, static assets, and root route
  if (
    pathname === '/' ||
    pathname.startsWith('/api/public') ||
    pathname === '/api/healthz' ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  // Basic redirects (minimal, no external dependencies)
  if (pathname === '/home') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === '/backtest-lab') {
    const url = request.nextUrl.clone();
    url.pathname = '/backtest';
    return NextResponse.redirect(url, 308);
  }

  // Basic security headers (minimal set)
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/healthz).*)'],
};


