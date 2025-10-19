'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { connectBtcturk } from '@/lib/ws/btcturk';
import { rafBatch } from '@/lib/ws/rafBatch';

export default function MarketProvider({ children }: { children: React.ReactNode }) {
  const setTicker = useMarketStore(s => s.setTicker);
  const markStatus = useMarketStore(s => s.markStatus);

  useEffect(() => {
    markStatus('connecting');
    
    const push = rafBatch((batch: any[]) => {
      batch.forEach(setTicker);
      markStatus('healthy');
    });

    const stop = connectBtcturk(
      (tickers) => tickers.forEach(push),
      {
        // url: process.env.NEXT_PUBLIC_BTCTURK_WS, // Optional .env
        symbols: ['BTCUSDT', 'ETHUSDT', 'BTCTRY', 'ETHTRY'],
      }
    );

    return () => {
      stop();
      markStatus('down');
    };
  }, [setTicker, markStatus]);

  return <>{children}</>;
}

