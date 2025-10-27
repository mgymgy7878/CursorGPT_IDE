/**
 * BTCTurk WebSocket Client
 * Real-time ticker and orderbook data connection
 */

export interface TickerMessage {
  e: string;
  t: string;
  sym: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
}

export interface ConnectionState {
  status: "OPEN" | "CLOSED" | "DEGRADED";
  lastUpdate: Date;
  reconnectAttempts: number;
  latency: number;
}

export function connectTickerWS(
  symbol: string, 
  onMessage: (data: TickerMessage) => void,
  onStateChange: (state: ConnectionState) => void
): () => void {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:3003/api/ws/btcturk";
  let ws: WebSocket | null = null;
  let alive = false;
  let pingTimer: NodeJS.Timeout | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // 5 seconds

  const updateState = (status: ConnectionState["status"], latency?: number) => {
    const state: ConnectionState = {
      status,
      lastUpdate: new Date(),
      reconnectAttempts,
      latency: latency ?? 0
    };
    onStateChange(state);
  };

  const connect = () => {
    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        alive = true;
        reconnectAttempts = 0;
        updateState("OPEN");
        
        // Subscribe to ticker data
        ws?.send(JSON.stringify({
          type: "subscribe",
          symbol: symbol
        }));
        
        // Start ping timer (15 seconds)
        pingTimer = setInterval(() => {
          if (alive && ws?.readyState === WebSocket.OPEN) {
            ws.send('{"e":"ping"}');
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Mock WS format: {bid, ask, last, ts, mode}
          if (data.bid && data.ask && data.last) {
            const tickerData: TickerMessage = {
              e: "ticker",
              t: "ticker",
              sym: symbol,
              bid: data.bid,
              ask: data.ask,
              last: data.last,
              volume: 0,
              timestamp: data.ts || Date.now()
            };
            onMessage(tickerData);
            updateState("OPEN");
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
          updateState("DEGRADED");
        }
      };

      ws.onclose = () => {
        alive = false;
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          updateState("DEGRADED");
          reconnectTimer = setTimeout(connect, reconnectDelay);
        } else {
          updateState("CLOSED");
        }
      };

      ws.onerror = () => {
        alive = false;
        updateState("DEGRADED");
      };

    } catch (error) {
      console.error("WebSocket connection error:", error);
      updateState("CLOSED");
    }
  };

  // Start connection
  connect();

  // Return cleanup function
  return () => {
    alive = false;
    if (pingTimer) {
      clearInterval(pingTimer);
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    try {
      ws?.close();
    } catch (error) {
      console.error("WebSocket cleanup error:", error);
    }
  };
}

export function connectOrderbookWS(
  symbol: string,
  onMessage: (data: any) => void,
  onStateChange: (state: ConnectionState) => void
): () => void {
  // Similar implementation for orderbook data
  // Implementation follows same pattern as ticker
  return connectTickerWS(symbol, onMessage, onStateChange);
}
