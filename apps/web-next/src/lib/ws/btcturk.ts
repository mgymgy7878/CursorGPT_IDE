import type { Ticker } from '@/types/market';

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
      } catch (err) {
        console.warn('BTCTurk WS parse error:', err);
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
    };
  };

  open();

  return () => {
    closing = true;
    stopHeartbeat();
    try { ws?.close(); } catch {}
  };
}

