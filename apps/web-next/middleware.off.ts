import { NextResponse as R } from 'next/server';
export function middleware(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === '/' || url.pathname === '/index' || url.pathname === '/index.html') {
    url.pathname = '/ops';
    return R.redirect(url);
  }
  return R.next();
}
export const config = { matcher: ['/', '/index', '/index.html'] };