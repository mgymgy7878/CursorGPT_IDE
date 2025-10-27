// services/marketdata/src/readers/bist-eq.ts
// Vendor-agnostic BIST Pay Piyasası reader (PoC)
// TODO: Replace mock with real vendor adapter (dxFeed/Matriks/ICE)

import { bistMetrics } from '../metrics/bist.js';

export interface BISTTick {
  symbol: string;
  price: number;
  quantity: number;
  side: 'B' | 'S'; // Buy or Sell
  timestamp: number;
}

type TickListener = (tick: BISTTick) => void;

// Global state
let lastTickTimestamp = 0;
const listeners: TickListener[] = [];
let mockInterval: NodeJS.Timeout | null = null;

/**
 * Start BIST equity mock feed (PoC)
 * Generates random ticks for testing until vendor adapter ready
 */
export function startBISTEquityMock(symbols: string[] = ['THYAO', 'AKBNK', 'GARAN', 'ISCTR']): () => void {
  bistMetrics.wsConnects.inc();
  console.log('[BIST-EQ] Mock feed started for symbols:', symbols);

  mockInterval = setInterval(() => {
    const now = Date.now();
    
    // Generate random tick
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const tick: BISTTick = {
      symbol,
      price: 100 + Math.random() * 50, // Random price 100-150
      quantity: 100 + Math.floor(Math.random() * 900), // Random qty 100-1000
      side: Math.random() > 0.5 ? 'B' : 'S',
      timestamp: now,
    };

    // Update metrics
    bistMetrics.wsMessages.inc({ message_type: 'trade' });
    lastTickTimestamp = now;
    bistMetrics.lastUpdate.set(now / 1000);
    
    const staleness = Math.max(0, (Date.now() - lastTickTimestamp) / 1000);
    bistMetrics.staleness.set(staleness);

    // Notify listeners
    listeners.forEach((listener) => {
      try {
        listener(tick);
      } catch (err) {
        console.error('[BIST-EQ] Listener error:', err);
      }
    });
  }, 300); // 300ms interval (~3 ticks/second)

  // Return cleanup function
  return () => {
    if (mockInterval) {
      clearInterval(mockInterval);
      mockInterval = null;
      console.log('[BIST-EQ] Mock feed stopped');
    }
  };
}

/**
 * Subscribe to BIST tick events
 */
export function onBISTTick(callback: TickListener): void {
  listeners.push(callback);
}

/**
 * Get last tick timestamp
 */
export function getLastTickTimestamp(): number {
  return lastTickTimestamp;
}

/**
 * Get staleness (seconds since last tick)
 */
export function getStaleness(): number {
  return Math.max(0, (Date.now() - lastTickTimestamp) / 1000);
}

/**
 * TODO: Real vendor adapter
 * 
 * Example for dxFeed:
 * export class DXFeedBISTAdapter {
 *   connect() {
 *     // Connect to dxFeed API
 *     // Subscribe to symbols
 *     // Handle tick events
 *   }
 * }
 * 
 * Example for Matriks:
 * export class MatriksBISTAdapter {
 *   connect() {
 *     // Connect to Matriks WebSocket
 *     // Subscribe to symbols
 *     // Handle market data
 *   }
 * }
 */

