import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
// eslint/types bypass for runtime-provided WS
declare const WebSocket: any;

// Prometheus-like counters (simple in-memory)
let streamsConnected = 0;
let streamsMessagesTotal = 0;
let streamsErrorsTotal = 0;

// Connection limit per IP (simple Map)
const connections = new Map<string, number>();
const MAX_CONNECTIONS = 3;

type KlineMsg = {
  e: "kline";
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    i: string;
    f: number;
    L: number;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
    q: string;
    V: string;
    Q: string;
    B: string;
  };
};

// Input validation
const SYMBOL_REGEX = /^[A-Z0-9]{3,15}$/;
const VALID_TF = new Set(["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d", "1w", "1M"]);

function mapTf(tf: string) {
  return VALID_TF.has(tf) ? tf : "1m";
}

function backoff() {
  return 1500 + Math.random() * 3500;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSymbol = searchParams.get("symbol") || "BTCUSDT";
  const rawTf = searchParams.get("timeframe") || "1m";
  
  const symbol = rawSymbol.toUpperCase();
  const interval = rawTf;
  
  // Validation
  if (!SYMBOL_REGEX.test(symbol) || !VALID_TF.has(interval)) {
    return new Response("bad_request", { status: 400 });
  }
  
  // Connection limit (per IP) - extract real IP from proxy headers
  const fwd = req.headers.get("x-forwarded-for");
  const clientIp = (fwd?.split(",")[0]?.trim()) || req.headers.get("x-real-ip") || "unknown";
  const count = connections.get(clientIp) || 0;
  
  if (count >= MAX_CONNECTIONS) {
    return new Response("too_many_connections", { status: 429 });
  }
  
  connections.set(clientIp, count + 1);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const write = (obj: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {}
      };
      
      // Metrics
      streamsConnected++;
      
      // Retry instruction
      controller.enqueue(encoder.encode(`retry: 3000\n\n`));
      
      // Keepalive
      const keep = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      }, 15000);

      // Try globalThis.WebSocket, fallback to ws module if available
      let WS: any = (globalThis as any).WebSocket ?? null;
      if (!WS) {
        try { WS = require("ws"); } catch { WS = null; }
      }
      if (!WS) {
        write({ event: "error", message: "WebSocket unavailable" });
        return;
      }
      const topic = `${symbol.toLowerCase()}@kline_${interval}`;
      let ws: any | null = null;
      let reconnectTimer: NodeJS.Timeout | null = null;
      let heartbeatTimer: NodeJS.Timeout | null = null;
      let alive = false;

      function connectWS() {
        if (ws) {
          try { ws.terminate(); } catch {}
        }
        
        const url = `wss://stream.binance.com:9443/ws/${topic}`;
        // @ts-ignore runtime WS type
        ws = new WS(url, { handshakeTimeout: 5000 });
        
        // Heartbeat
        alive = false;
        heartbeatTimer = setInterval(() => {
          if (!alive && ws) {
            try { ws.terminate(); } catch {}
          }
          alive = false;
          try { (ws as any)?.ping?.(); } catch {}
        }, 30000);

        ws.on?.("open", () => {
          alive = true;
          write({ event: "open", symbol, interval });
        });

        (ws as any).on?.("pong", () => {
          alive = true;
        });

        ws.on?.("message", (buf: Buffer) => {
          try {
            const msg = JSON.parse(buf.toString()) as KlineMsg;
            if (msg?.e !== "kline") return;
            
            const k = msg.k;
            write({
              event: "kline",
              symbol,
              interval,
              t: k.t,
              o: +k.o,
              h: +k.h,
              l: +k.l,
              c: +k.c,
              v: +k.v,
              final: k.x
            });
            streamsMessagesTotal++;
          } catch {}
        });

        ws.on?.("close", () => {
          write({ event: "close" });
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          
          // Auto-reconnect with jitter
          reconnectTimer = setTimeout(() => {
            connectWS();
          }, backoff());
        });

        ws.on?.("error", (err: any) => {
          streamsErrorsTotal++;
          write({ event: "error", message: String((err as any)?.message || err) });
          try { ws?.close(); } catch {}
        });
      }

      // Initial connection
      connectWS();

      // Client disconnect cleanup
      const abort = (req as any).signal as AbortSignal | undefined;
      abort?.addEventListener("abort", () => {
        try { ws?.close(); } catch {}
        try { if (keep) clearInterval(keep); } catch {}
        try { if (heartbeatTimer) clearInterval(heartbeatTimer); } catch {}
        try { if (reconnectTimer) clearTimeout(reconnectTimer); } catch {}
        
        // Decrement connection count
        const currentCount = connections.get(clientIp) || 0;
        if (currentCount > 0) {
          connections.set(clientIp, currentCount - 1);
        }
        streamsConnected--;
        
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Streams-Connected": String(streamsConnected),
      "X-Streams-Messages": String(streamsMessagesTotal),
      "X-Streams-Errors": String(streamsErrorsTotal)
    }
  });
}

// Metrics endpoint (optional, for monitoring)
export async function HEAD(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "X-Streams-Connected": String(streamsConnected),
      "X-Streams-Messages": String(streamsMessagesTotal),
      "X-Streams-Errors": String(streamsErrorsTotal)
    }
  });
}

