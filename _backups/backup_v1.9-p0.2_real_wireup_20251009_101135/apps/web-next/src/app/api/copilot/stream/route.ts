import { NextRequest } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Periodic snapshot (10s interval)
      const interval = setInterval(async () => {
        try {
          // Fetch status snapshot
          const [healthRes, metricsRes] = await Promise.allSettled([
            fetch(`${EXECUTOR_URL}/health`, { signal: AbortSignal.timeout(2000) }),
            fetch(`${EXECUTOR_URL}/metrics`, { signal: AbortSignal.timeout(2000) }),
          ]);

          let health: 'healthy' | 'degraded' | 'down' = 'down';
          if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
            health = 'healthy';
          }

          // Parse metrics (simplified)
          let metrics = { p95_ms: 0, error_rate: 0, psi: 0, match_rate: 0 };
          if (metricsRes.status === 'fulfilled') {
            const metricsText = await metricsRes.value.text();
            // Simple regex parsing (real implementation should be more robust)
            const p95Match = metricsText.match(/ml_predict_latency_ms.*?\s+([\d.]+)/);
            if (p95Match) metrics.p95_ms = parseFloat(p95Match[1]);
          }

          const snapshot = {
            health,
            metrics,
            openOrders: 0, // Placeholder
            positions: 0,  // Placeholder
            timestamp: Date.now(),
          };

          sendEvent('status', snapshot);
        } catch (err) {
          console.error('[SSE] Snapshot error:', err);
        }
      }, 10000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });

      // Send initial heartbeat
      sendEvent('connected', { message: 'SSE connected' });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

