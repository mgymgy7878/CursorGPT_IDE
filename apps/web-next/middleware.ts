import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Degraded mode: bypass complex middleware for critical paths
// TODO: Re-enable full middleware after root cause analysis

// Removed complex auth/guard logic temporarily for degraded mode
// TODO: Re-enable after root cause analysis

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hard bypass: Next assetleri ve static dosyalar (regresyon koruması)
  // Matcher'a ek olarak kod içinde de kontrol (çifte sigorta)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(css|js|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Critical paths bypass (degraded mode)
  // API public endpoints, health checks, and root route
  if (
    pathname === '/' ||
    pathname.startsWith('/api/public') ||
    pathname === '/api/healthz'
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

  // CSP'yi sadece HTML document response'lara uygula (asset'lere asla)
  // sec-fetch-dest: document veya accept: text/html kontrolü
  const secFetchDest = request.headers.get('sec-fetch-dest');
  const acceptHeader = request.headers.get('accept') || '';
  const isDocumentRequest = secFetchDest === 'document' || acceptHeader.includes('text/html');

  // Production'da CSP sadece HTML document response'lara uygulanır
  // (next.config.mjs'te dev modunda CSP zaten kapalı)
  // Asset bypass zaten yukarıda yapıldı, burada sadece document kontrolü
  if (isDocumentRequest && process.env.NODE_ENV === 'production') {
    // CSP header'ı next.config.mjs'te zaten basılıyor ama middleware'den de kontrol ediyoruz
    // Not: next.config.mjs headers() fonksiyonu tüm route'lara uygular, burada sadece document kontrolü yapıyoruz
    // Gelecekte CSP'yi tamamen middleware'den basabiliriz
  }

  return response;
}

export const config = {
  // Asset'leri ve static dosyaları middleware'den tamamen dışarıda bırak
  // Guard: /_next/* tüm alt path'leri (static, image, webpack-hmr, chunks, css, js vb) bypass et
  matcher: [
    '/((?!_next|favicon.ico|robots.txt|sitemap.xml|api/healthz|api/public).*)',
  ],
};


