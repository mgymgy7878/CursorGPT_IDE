/**
 * useMarketCandles - Live market candles hook with mock fallback
 *
 * Primary: /api/live/market/candles endpoint
 * Fallback: mock data generator
 * Optional: SSE stream for real-time updates
 */

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useSse } from '@/lib/live/useSse';

export interface Candle {
  t: number; // timestamp (ms)
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface UseMarketCandlesOptions {
  exchange: string;
  symbol: string;
  tf: string; // timeframe: "1m", "5m", "1h", "1d", etc.
  limit?: number;
  enableStream?: boolean; // SSE stream için
}

export interface UseMarketCandlesResult {
  candles: Candle[];
  status: 'loading' | 'healthy' | 'degraded' | 'stale' | 'error' | 'mock';
  error?: Error;
  source: 'feed' | 'binance' | 'mock';
}

const fetcher = async (url: string): Promise<{ candles: Candle[]; source: string }> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch candles: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    candles: data.candles || data || [],
    source: data.source || 'binance',
  };
};

export function useMarketCandles({
  exchange,
  symbol,
  tf,
  limit = 500,
  enableStream = false,
}: UseMarketCandlesOptions): UseMarketCandlesResult {
  // Primary: /api/live/market/candles endpoint
  const url = `/api/live/market/candles?symbol=${symbol}&tf=${tf}&limit=${limit}`;
  const { data, error, isLoading } = useSWR<{ candles: Candle[]; source: string }>(
    url,
    fetcher,
    {
      refreshInterval: 5000, // 5s polling (SSE varsa daha az sıklıkta)
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false, // Don't retry, fallback to mock
    }
  );

  const [candles, setCandles] = useState<Candle[]>([]);
  const [source, setSource] = useState<'feed' | 'binance' | 'mock'>('mock');
  const lastUpdateRef = useRef<number>(Date.now());

  // SSE stream for real-time updates (optional)
  const streamUrl = enableStream ? `/api/live/market/stream?symbol=${symbol}&tf=${tf}` : null;
  const { lastMessageAt, isConnected } = useSse({
    url: streamUrl || '',
    enabled: !!streamUrl,
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'candle' && payload.data) {
          // Son candle'ı güncelle
          setCandles((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.t === payload.data.t) {
              // Aynı timestamp, update et
              updated[updated.length - 1] = payload.data;
            } else {
              // Yeni candle, ekle
              updated.push(payload.data);
              if (updated.length > limit) {
                updated.shift(); // Limit'i aşarsa eskiyi çıkar
              }
            }
            return updated;
          });
          lastUpdateRef.current = Date.now();
        }
      } catch (err) {
        // Parse error, ignore
      }
    },
  });

  // Generate mock candles helper
  function generateMockCandles(): Candle[] {
    const now = Date.now();
    const candles: Candle[] = [];
    let price = 42000 + (symbol.charCodeAt(0) % 10000);

    for (let i = limit - 1; i >= 0; i--) {
      const change = (Math.random() - 0.5) * 200;
      const open = price;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;
      const volume = 1000000 + Math.random() * 500000;

      // Timeframe multiplier (approximate)
      const tfMs = tf.includes('m') ? parseInt(tf) * 60 * 1000 :
                   tf.includes('H') || tf === '1H' ? 60 * 60 * 1000 :
                   tf.includes('d') || tf === '1D' ? 24 * 60 * 60 * 1000 :
                   60 * 60 * 1000; // default 1h

      candles.push({
        t: now - (i * tfMs),
        o: open,
        h: high,
        l: low,
        c: close,
        v: volume,
      });

      price = close;
    }

    return candles;
  }

  // Update candles from API data
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (error || !data) {
      // Fallback to mock
      setCandles(generateMockCandles());
      setSource('mock');
      return;
    }

    if (data.candles && data.candles.length > 0) {
      setCandles(data.candles);
      setSource(data.source === 'feed' ? 'feed' : 'binance');
      lastUpdateRef.current = Date.now();
    } else {
      // Empty response, use mock
      setCandles(generateMockCandles());
      setSource('mock');
    }
  }, [data, error, isLoading, symbol, tf, limit]);

  // Determine status
  let status: 'loading' | 'healthy' | 'degraded' | 'stale' | 'error' | 'mock' = 'loading';
  if (isLoading) {
    status = 'loading';
  } else if (error) {
    status = 'mock'; // Error durumunda mock kullanıyoruz
  } else if (candles.length > 0) {
    // Check staleness: last candle should be recent
    const lastCandle = candles[candles.length - 1];
    const age = Date.now() - lastCandle.t;

    // SSE stream aktifse ve son mesaj yakınsa healthy
    if (enableStream && isConnected && lastMessageAt && (Date.now() - lastMessageAt < 5000)) {
      status = 'healthy';
    } else if (age < 10000) {
      status = 'healthy';
    } else if (age < 30000) {
      status = 'degraded';
    } else {
      status = 'stale';
    }

    // Source mock ise status'u mock yap
    if (source === 'mock') {
      status = 'mock';
    }
  } else {
    status = 'mock';
  }

  return {
    candles,
    status,
    error: error || undefined,
    source,
  };
}
