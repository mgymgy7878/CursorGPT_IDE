export const dynamic = 'force-dynamic';

/**
 * Live Market Stream API - SSE proxy for real-time candle updates
 * GET /api/live/market/stream?symbol=BTCUSDT&tf=1h
 *
 * Proxies SSE stream from Feed/Executor to client
 */

const EXECUTOR_URL = process.env.EXECUTOR_URL || process.env.NEXT_PUBLIC_EXECUTOR_URL || 'http://127.0.0.1:4001';
const FEED_URL = process.env.FEED_URL || process.env.NEXT_PUBLIC_FEED_URL || EXECUTOR_URL;

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const tf = searchParams.get('tf') || searchParams.get('timeframe') || '1h';

  // SSE stream oluştur
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let abortController: AbortController | null = null;
      let upstreamResponse: Response | null = null;

      const sendEvent = (data: string, event?: string) => {
        const prefix = event ? `event: ${event}\n` : '';
        controller.enqueue(encoder.encode(`${prefix}data: ${data}\n\n`));
      };

      const cleanup = () => {
        if (abortController) {
          abortController.abort();
        }
      };

      // Client disconnect'i dinle
      req.signal.addEventListener('abort', cleanup);

      try {
        // Feed'den SSE stream'i çek
        abortController = new AbortController();
        const feedStreamUrl = `${FEED_URL}/api/market/stream?symbol=${symbol}&timeframe=${tf}`;

        upstreamResponse = await fetch(feedStreamUrl, {
          signal: abortController.signal,
          headers: {
            'Accept': 'text/event-stream',
          },
        });

        if (!upstreamResponse.ok || !upstreamResponse.body) {
          // Feed yoksa mock stream gönder
          sendEvent(JSON.stringify({ type: 'error', message: 'Feed unavailable, using mock stream' }));

          // Mock tick gönder (her 2 saniyede bir)
          const mockInterval = setInterval(() => {
            const mockCandle = {
              t: Date.now(),
              o: 42000 + Math.random() * 1000,
              h: 43000 + Math.random() * 500,
              l: 41000 - Math.random() * 500,
              c: 42000 + Math.random() * 1000,
              v: 1000000 + Math.random() * 500000,
            };
            sendEvent(JSON.stringify({ type: 'candle', data: mockCandle }));
          }, 2000);

          req.signal.addEventListener('abort', () => {
            clearInterval(mockInterval);
            controller.close();
          });
          return;
        }

        // Upstream stream'i pass-through et
        const reader = upstreamResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Client disconnect, normal
          controller.close();
          return;
        }

        // Hata durumunda mock stream'e geç
        sendEvent(JSON.stringify({ type: 'error', message: error.message || 'Stream error' }));

        const mockInterval = setInterval(() => {
          const mockCandle = {
            t: Date.now(),
            o: 42000 + Math.random() * 1000,
            h: 43000 + Math.random() * 500,
            l: 41000 - Math.random() * 500,
            c: 42000 + Math.random() * 1000,
            v: 1000000 + Math.random() * 500000,
          };
          sendEvent(JSON.stringify({ type: 'candle', data: mockCandle }));
        }, 2000);

        req.signal.addEventListener('abort', () => {
          clearInterval(mockInterval);
          controller.close();
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
