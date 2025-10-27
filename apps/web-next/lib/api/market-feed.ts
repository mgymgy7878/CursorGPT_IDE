import { startTickerPolling, fetchBtcturkTicker, Ticker } from './btcturk';
import { connectTickerWS, TickerMessage, ConnectionState } from './btcturk-ws';

type MarketFeedOptions = {
  symbol: string;
  onData: (data: Ticker) => void;
  onStatus: (status: 'OPEN' | 'DEGRADED' | 'CLOSED') => void;
  onError?: (error: unknown) => void;
};

const backoff = [1000, 2000, 4000, 8000];

export function startMarketFeed({ symbol, onData, onStatus, onError }: MarketFeedOptions): () => void {
  if (process.env.NEXT_PUBLIC_WS_ENABLED === 'true') {
    // WebSocket ile başla, fallback polling
    let fallbackUnsubscribe: (() => void) | null = null;
    
    const wsUnsubscribe = connectTickerWS(
      symbol,
      (wsData: TickerMessage) => {
        // Convert WS message to Ticker format
        const ticker: Ticker = {
          bid: wsData.bid,
          ask: wsData.ask,
          last: wsData.last,
          ts: wsData.timestamp.toString()
        };
        onData(ticker);
      },
      (state: ConnectionState) => {
        onStatus(state.status);
        if (state.status === 'CLOSED' && !fallbackUnsubscribe) {
          // WS kapandığında polling'e geç
          fallbackUnsubscribe = startTickerPolling({
            symbol,
            intervalMs: 2000,
            onData: (data) => onData(data as any),
            onError
          });
        }
      }
    );
    
    return () => {
      wsUnsubscribe();
      fallbackUnsubscribe?.();
    };
  }
  
  // Direct polling if WS disabled
  return startTickerPolling({ 
    symbol, 
    intervalMs: 2000, 
    onData,
    onError 
  });
}

function startBtcturkWS({
  symbol,
  onOpen,
  onMessage,
  onCloseOrError,
  backoffMs,
  maxReconnects
}: {
  symbol: string;
  onOpen: () => void;
  onMessage: (data: TickerMessage) => void;
  onCloseOrError: () => () => void;
  backoffMs: number[];
  maxReconnects: number;
}): () => void {
  let fallbackCleanup: (() => void) | null = null;
  let reconnectAttempts = 0;

  const cleanup = connectTickerWS(
    symbol,
    (data: TickerMessage) => {
      onMessage(data);
      onOpen();
    },
    (state: ConnectionState) => {
      if (state.status === 'CLOSED' || state.status === 'DEGRADED') {
        if (reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          // Start fallback polling
          if (!fallbackCleanup) {
            fallbackCleanup = onCloseOrError();
          }
        }
      } else if (state.status === 'OPEN') {
        // WS is back, stop fallback
        if (fallbackCleanup) {
          fallbackCleanup();
          fallbackCleanup = null;
        }
        reconnectAttempts = 0;
      }
    }
  );

  return () => {
    cleanup();
    if (fallbackCleanup) {
      fallbackCleanup();
    }
  };
}
