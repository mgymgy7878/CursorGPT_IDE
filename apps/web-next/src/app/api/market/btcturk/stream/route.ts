/**
 * BTCTurk Stream API (Server-Sent Events)
 * GET /api/market/btcturk/stream?symbol=BTC_TRY
 * 
 * Pushes real-time ticker updates from WebSocket
 */

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC_TRY';

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let lastEmit = 0;
      const throttle = 250; // ms

      // Send initial ping
      const ping = encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
      controller.enqueue(ping);

      // Mock ticker updates (real WS integration in Phase 2)
      const interval = setInterval(async () => {
        try {
          const now = Date.now();
          if (now - lastEmit < throttle) return;

          const { fetchBTCTurkTicker } = await import('@/lib/marketdata/btcturk');
          const ticker = await fetchBTCTurkTicker(symbol);

          const data = encoder.encode(`data: ${JSON.stringify({ type: 'ticker', data: ticker })}\n\n`);
          controller.enqueue(data);
          
          lastEmit = now;
        } catch (err) {
          const error = encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`);
          controller.enqueue(error);
        }
      }, 1000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

