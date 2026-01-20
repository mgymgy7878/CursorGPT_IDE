import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redirects } from '@/config/routes';
import { roleOfRoute, protectedRoutes } from '@/config/route-guard';
import { inferRolesFromCookie } from '@/lib/auth';

function normalize(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isProtectedPath(pathname: string): boolean {
  const p = normalize(pathname);
  const protectedFallback = [
    '/portfolio',
    '/strategies',
    '/running',
    '/strategy-lab',
    '/backtest',
    '/technical-analysis',
    '/alerts',
    '/observability',
    '/reports',
    '/reports/verify',
  ];
  const list = [...new Set([...protectedRoutes, ...protectedFallback])];
  return list.some((r) => {
    const rp = normalize(r);
    return p === rp || p.startsWith(rp + '/');
  });
}

function pickToken(req: NextRequest): string {
  const authz = req.headers.get('authorization') || '';
  const bearer = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  return (
    req.cookies.get('auth')?.value ||
    req.cookies.get('spark_session')?.value ||
    bearer ||
    ''
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CRITICAL: Next static + API must never be rewritten/intercepted
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (pathname === "/favicon.ico") {
    return NextResponse.next();
  }
  // Static assets
  if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|woff2?)$/.test(pathname)) {
    return NextResponse.next();
  }

  // Centralized redirects (single-source from config/routes.ts)
  const hit = redirects.find(r => pathname === r.from);
  if (hit) {
    const url = request.nextUrl.clone();
    url.pathname = hit.to;
    return NextResponse.redirect(url, 308);
  }

  // ---- Auth Guard ----
  const guardOn = (process.env.AUTH_ENABLED === '1') || (process.env.NEXT_PUBLIC_AUTH_ENABLED === '1') || (process.env.FORCE_GUARD === '1') || (process.env.NODE_ENV === 'production');
  const dbg = process.env.DEBUG_GUARD === '1';
  let guardHit = false;
  if (guardOn && isProtectedPath(pathname)) {
    guardHit = true;
    const token = pickToken(request);
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const res = NextResponse.redirect(url, 307);
      res.headers.set('x-ux-guard', 'hit');
      if (dbg) {
        res.headers.set('x-ux-path', pathname);
        res.headers.set('x-ux-token', 'absent');
      }
      return res;
    }
    const roles = inferRolesFromCookie(token);
    const allowed = roleOfRoute(pathname);
    const ok = !allowed || roles.some(r => allowed.includes(r));
    if (!ok) {
      const headers: Record<string, string> = { 'content-type': 'application/json', 'x-ux-guard': 'hit' };
      if (dbg) {
        headers['x-ux-path'] = pathname;
        headers['x-ux-token'] = 'present';
        headers['x-ux-need'] = JSON.stringify(allowed || []);
        headers['x-ux-roles'] = JSON.stringify(roles || []);
      }
      return new NextResponse(JSON.stringify({ error: 'forbidden' }), { status: 403, headers });
    }
  }

  const response = NextResponse.next();
  if (guardHit) {
    response.headers.set('x-ux-guard', 'hit');
    if (dbg) {
      response.headers.set('x-ux-path', pathname);
      // token presence is not echoed on pass-through
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // CSP artık next.config.mjs'de tanımlı, middleware'de sadece report-only için set ediyoruz
  const reportOnly = process.env.NEXT_PUBLIC_CSP_REPORT_ONLY === '1';
  // CSP başlığı next.config.mjs headers() tarafından set ediliyor, middleware'de tekrar set etmiyoruz

  // Report-Only sıkı CSP (kırmadan telemetri topla)
  const cspStrict = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https: ws: wss:",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
  if (reportOnly) {
    response.headers.set('Content-Security-Policy-Report-Only', cspStrict);
    response.headers.delete('Content-Security-Policy');
  } else {
    response.headers.delete('Content-Security-Policy-Report-Only');
  }

  const traceId = request.headers.get('x-trace-id') || `web-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  response.headers.set('x-trace-id', traceId);

  const buildSha = process.env.BUILD_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || 'dev';
  response.headers.set('x-build-sha', buildSha);
  response.headers.set('x-ux-guard', response.headers.get('x-ux-guard') ?? 'miss');

  return response;
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|woff2?)$).*)'],
};

