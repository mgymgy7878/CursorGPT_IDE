// Copilot Providers - Real data adapters with deterministic fallbacks
// v1.9-p0.2 - Wire-up to real data sources

export type Order = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  px: number;
  ts: number;
};

export type Position = {
  symbol: string;
  side: 'LONG' | 'SHORT';
  qty: number;
  entryPx: number;
  upnl: number;
  ts: number;
};

/**
 * Fetch open orders from real adapter or fallback
 */
export async function fetchOrders(): Promise<Order[]> {
  // 1) Try real adapter (if exists)
  try {
    const mod = await import('../adapters/orders.js');
    return await mod.getOpenOrders();
  } catch {
    // Adapter not found
  }

  // 2) Deterministic fallback
  return [
    {
      id: 'ORD-BTC-1',
      symbol: 'BTCUSDT',
      side: 'BUY',
      qty: 0.01,
      px: 62000,
      ts: Date.now() - 12000,
    },
    {
      id: 'ORD-ETH-1',
      symbol: 'ETHUSDT',
      side: 'SELL',
      qty: 0.2,
      px: 2900,
      ts: Date.now() - 9000,
    },
  ];
}

/**
 * Fetch open positions from real adapter or fallback
 */
export async function fetchPositions(): Promise<Position[]> {
  // 1) Try real adapter (if exists)
  try {
    const mod = await import('../adapters/positions.js');
    return await mod.getOpenPositions();
  } catch {
    // Adapter not found
  }

  // 2) Deterministic fallback
  return [
    {
      symbol: 'BTCUSDT',
      side: 'LONG',
      qty: 0.015,
      entryPx: 61500,
      upnl: 55.7,
      ts: Date.now() - 60000,
    },
    {
      symbol: 'ETHUSDT',
      side: 'SHORT',
      qty: 0.3,
      entryPx: 2950,
      upnl: 19.3,
      ts: Date.now() - 60000,
    },
  ];
}

