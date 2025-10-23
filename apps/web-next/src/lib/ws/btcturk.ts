import type { Ticker } from '@/types/market';
import { incCounter, setGauge, metrics } from '@/server/metrics';

type OnBatch = (tickers: Ticker[]) => void;

/**
 * Normalize BTCTurk ticker message to common format
 * Handles multiple possible field names
 */
export function normalizeBtcturkTicker(msg: any): Ticker | null {
  // BTCTurk WS message formats vary; handle multiple field names
  const symbol = msg?.symbol || msg?.PS || msg?.pair || msg?.S;
  const price  = Number(msg?.price ?? msg?.P ?? msg?.last ?? msg?.L);
  const bid    = Number(msg?.bid ?? msg?.B ?? price);
  const ask    = Number(msg?.ask ?? msg?.A ?? price);
  const volume24h = Number(msg?.volume ?? msg?.V ?? 0);
  const change24h = Number(msg?.change ?? msg?.C ?? 0);
  const ts     = Number(msg?.ts ?? msg?.T ?? msg?.timestamp ?? Date.now());
  
  if (!symbol || !Number.isFinite(price)) return null;
  
  return { symbol, price, bid, ask, volume24h, change24h, ts };
}

/**
 * Connect to BTCTurk WebSocket with auto-reconnect
 */
export function connectBtcturk(
  onBatch: OnBatch,
  opts?: { url?: string; symbols?: string[] }
) {
  const url = opts?.url ?? 'wss://ws-feed-pro.btcturk.com/';
  const symbols = opts?.symbols ?? ['BTCUSDT', 'ETHUSDT'];

  let ws: WebSocket | null = null;
  let tries = 0;
  let closing = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const backoff = () => Math.min(30_000, 1000 * 2 ** tries) + Math.random() * 500;

  const subscribe = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    // BTCTurk subscribe message format
    const msg = {
      type: 151,
      channel: 'ticker',
      event: symbols,
      join: true
    };
    
    ws.send(JSON.stringify(msg));
  };

  const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const ping = { type: 114 }; // BTCTurk ping type
        try { ws.send(JSON.stringify(ping)); } catch {}
      }
    }, 30000); // 30s
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const open = () => {
    ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('✅ BTCTurk WS connected');
      tries = 0;
      subscribe();
      startHeartbeat();
    };
    
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        const arr = Array.isArray(data) ? data : [data];
        const tickers: Ticker[] = arr
          .map(normalizeBtcturkTicker)
          .filter(Boolean) as Ticker[];
        
        if (tickers.length) {
          onBatch(tickers);
        }
        // Basic counters for channel types
        for (const msg of arr) {
          const ch = Array.isArray(msg) ? msg[0] : msg?.type;
          if (ch === 422) incCounter('spark_ws_trades_msgs_total', 1);
          if (ch === 431 || ch === 432) incCounter('spark_ws_orderbook_msgs_total', 1);
        }
        // Update staleness gauge
        if (metrics.gauges.spark_ws_last_message_ts) {
          const now = Date.now();
          const last = metrics.gauges.spark_ws_last_message_ts || now;
          setGauge('spark_ws_staleness_seconds', Math.max(0, (now - last) / 1000));
        }
      } catch (err) {
        console.warn('BTCTurk WS parse error:', err);
        incCounter('spark_ws_trades_errors_total', 1);
      }
    };
    
    ws.onclose = () => {
      console.warn('⚠️ BTCTurk WS closed');
      stopHeartbeat();
      
      if (!closing) {
        tries += 1;
        const delay = backoff();
        console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${tries})`);
        setTimeout(open, delay);
      }
    };
    
    ws.onerror = (err) => {
      console.error('❌ BTCTurk WS error:', err);
      incCounter('spark_ws_orderbook_errors_total', 1);
    };
  };

  open();

  return () => {
    closing = true;
    stopHeartbeat();
    try { ws?.close(); } catch {}
  };
}


// Below: class-based BTCTurk client with pause/resume and reconnect
export type BtcturkEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'ticker'; pair: string; last: number; bid: number; ask: number; ts: number };

type Pair = string;
type SubMsg = [151, { type: 151; channel: string; event: string; join: boolean }];

export class BtcturkWS {
  private ws?: WebSocket;
  private backoff = 1000;
  private closed = false;

  public lastMessageTs = 0;
  public connected = false;

  constructor(
    private url: string,
    private pairs: Pair[],
    private onEvent: (e: BtcturkEvent) => void,
  ) {}

  // Optional additional subscriptions for trades (422) and orderbook (431/432)
  subscribeTrades(pair: string) {
    this.sub(true, [pair]);
  }

  subscribeOrderBook(pair: string) {
    this.sub(true, [pair]);
  }

  connect() {
    if (!this.url) throw new Error('NEXT_PUBLIC_WS_BTCTURK missing');
    this.closed = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.backoff = 1000;
      this.onEvent({ type: 'open' });
      this.subscribeAll(true);
    };

    this.ws.onmessage = (ev) => {
      this.lastMessageTs = Date.now();
      const msg = safeParse(ev.data as string);
      if (Array.isArray(msg)) {
        const ch = msg[0];
        const payload = msg[1];
        if (ch === 402 && payload) {
          const pair = String(payload.P ?? payload.p ?? payload.pair ?? '').toUpperCase();
          const last = toNum(payload.A ?? payload.last ?? payload.a);
          const bid = toNum(payload.B ?? payload.bid ?? payload.b);
          const ask = toNum(payload.S ?? payload.ask ?? payload.s);
          if (pair && Number.isFinite(last)) {
            this.onEvent({ type: 'ticker', pair, last, bid, ask, ts: this.lastMessageTs });
          }
        }
        // Trades channel (422) and OrderBook (431/432) counters (best-effort)
        if (ch === 422) {
          try { (window as any)?.sparkCounters?.inc?.('spark_ws_btcturk_trades_total'); } catch {}
        }
        if (ch === 431 || ch === 432) {
          try { (window as any)?.sparkCounters?.inc?.('spark_ws_btcturk_orderbook_updates_total'); } catch {}
        }
      }
    };

    this.ws.onerror = () => { try { this.ws?.close(); } catch {} };
    this.ws.onclose = () => {
      this.connected = false;
      this.onEvent({ type: 'close' });
      if (!this.closed) this.reconnect();
    };
  }

  pause(pairs = this.pairs) { this.sub(false, pairs); }
  resume(pairs = this.pairs) { this.sub(true, pairs); }
  setPairs(pairs: Pair[]) { this.pairs = pairs; this.subscribeAll(true); }
  dispose() { this.closed = true; try { this.ws?.close(); } catch {} }

  private subscribeAll(join: boolean) { this.sub(join, this.pairs); }
  private sub(join: boolean, pairs: Pair[]) {
    for (const p of pairs) this.send([151, { type: 151, channel: '402', event: p.toUpperCase(), join }]);
  }
  private send(msg: SubMsg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
  private reconnect() {
    const delay = Math.min(this.backoff + 500, 30000) + Math.floor(Math.random() * 400);
    this.backoff = delay;
    setTimeout(() => { if (!this.closed) this.connect(); }, delay);
  }
}

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return null; } }
function toNum(x: any): number { const n = Number(x); return Number.isFinite(n) ? n : NaN; }