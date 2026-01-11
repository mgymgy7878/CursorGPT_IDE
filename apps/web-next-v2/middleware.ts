import { NextResponse, type NextRequest } from 'next/server';

/**
 * CSP Middleware - Next.js Resmi Örneğine Uygun
 *
 * Özellikler:
 * - Sadece HTML isteklerinde çalışır (Accept: text/html kontrolü)
 * - Matcher ile _next/static, _next/image, favicon.ico hariç tutulur
 * - DEV: unsafe-inline/unsafe-eval (React Refresh ve dev overlay için)
 * - PROD: Nonce tabanlı strict CSP (OWASP best practices)
 *
 * Kaynak: https://nextjs.org/docs/app/guides/content-security-policy
 */
export function middleware(req: NextRequest) {
  // Sadece HTML isteklerinde CSP uygula
  // NOT: Statik dosyalar (CSS, JS, images) middleware'den izole edilir
  if (!req.headers.get('accept')?.includes('text/html')) {
    return NextResponse.next();
  }

  // Edge runtime: crypto.randomUUID mevcut
  // Nonce formatı: UUID'den tire'leri kaldır (Next.js örneği)
  const nonce = crypto.randomUUID().replace(/-/g, '');

  // Dev/Prod CSP ayrımı
  const isDev = process.env.NODE_ENV !== 'production';

  // DEV CSP: React Refresh, Tailwind CSS ve dev overlay için unsafe-inline/unsafe-eval gerekli
  // Next.js resmi örneği: script-src 'self' 'unsafe-eval' 'unsafe-inline'
  const dev = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data:",
    "style-src 'self' 'unsafe-inline' blob: data:",
    "connect-src 'self' http: https: ws: wss:",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
  ].join('; ');

  // PROD CSP: Nonce tabanlı strict CSP (OWASP strict policy)
  // NOT: Element-spesifik direktiflere gerek yok (style-src-elem, style-src-attr)
  // style-src 'self' 'nonce-...' zaten <link rel="stylesheet"> dosyalarını kapsar
  const prod = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "connect-src 'self' https: ws: wss:",
    "font-src 'self' data:",
  ].join('; ');

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', isDev ? dev : prod);
  res.headers.set('x-nonce', nonce); // Debug için

  return res;
}

// Resmî matcher: statikler ve ikonlar hariç
// Next.js resmi örneği: _next/static, _next/image, favicon.ico hariç tut
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

