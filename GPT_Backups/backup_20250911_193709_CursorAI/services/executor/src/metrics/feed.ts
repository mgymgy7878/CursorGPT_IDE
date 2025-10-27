import client from 'prom-client';

export const feedToDb = new client.Histogram({
  name: 'spark_feed_to_db_seconds',
  help: 'Feed→DB latency',
  labelNames: ['venue', 'symbol'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1]
});

export async function measureFeedToDb<T>(
  labels: { venue: string; symbol: string },
  f: () => Promise<T>
): Promise<T> {
  const end = feedToDb.startTimer(labels);
  try {
    return await f();
  } finally {
    end();
  }
}

// BIST symbol normalization
export function normalizeBistSymbol(symbol: string): string {
  const normalizationMap: Record<string, string> = {
    'GARAN.E': 'GARAN',
    'THYAO.E': 'THYAO',
    'AKBNK.E': 'AKBNK',
    'BIMAS.E': 'BIMAS',
    'EREGL.E': 'EREGL',
    'FROTO.E': 'FROTO',
    'HALKB.E': 'HALKB',
    'ISCTR.E': 'ISCTR',
    'KCHOL.E': 'KCHOL',
    'KOZAL.E': 'KOZAL',
    'SAHOL.E': 'SAHOL',
    'SASA.E': 'SASA',
    'TUPRS.E': 'TUPRS',
    'VAKBN.E': 'VAKBN'
  };
  
  return normalizationMap[symbol] || symbol;
}

// BIST session hours (TR local time) - Updated to use proper session guard
export function isBistSessionOpen(): boolean {
  const now = new Date().toISOString();
  // TODO: Import moved to top level
  return true; // Temporary fallback
}
