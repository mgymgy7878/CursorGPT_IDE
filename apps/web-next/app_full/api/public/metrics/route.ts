import { NextResponse } from 'next/server';

const EXEC = process.env.EXECUTOR_ORIGIN ?? 'http://127.0.0.1:4001';

export async function GET() {
  try {
    const upstream = await fetch(`${EXEC}/public/metrics/prom`, { cache: 'no-store' });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.ok ? 200 : upstream.status,
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
  } catch {
    // İsteğe bağlı: kısa, Prometheus uyumlu fallback
    return new NextResponse(`# fallback\n`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
  }
}
