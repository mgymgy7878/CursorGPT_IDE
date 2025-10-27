import type { NextRequest } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXECUTOR = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

export async function GET(_req: NextRequest) {
  const upstream = await fetch(`${EXECUTOR}/canary/status`, {
    // ÖNEMLİ: cache kapalı ve SSE kabulü
    cache: 'no-store' as any,
    headers: { Accept: 'text/event-stream' }
  });

  if (!upstream.ok || !upstream.body) {
    const fallback = `data: ${JSON.stringify({ ok:false, degraded:true, reason:'upstream_fail' })}\n\n`;
    return new Response(fallback, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  }

  // Upstream body'yi doğrudan ilet
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
} 