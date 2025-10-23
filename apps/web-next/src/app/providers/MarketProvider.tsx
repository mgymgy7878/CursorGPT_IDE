'use client';

import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { BtcturkWS } from '@/lib/ws/btcturk';
import { inc, setGauge } from '@/lib/metrics/counters';
import { rafBatch } from '@/lib/ws/rafBatch';

export default function MarketProvider({ children, initialPairs }: { children: React.ReactNode; initialPairs?: string[] }) {
  const paused = useMarketStore((s) => s.paused);
  const upsert = useMarketStore((s) => s.setTicker);
  const markStatus = useMarketStore((s) => s.markStatus);
  const setLastTs = useMarketStore((s) => s.setLastMessageTs);
  const wsRef = useRef<BtcturkWS | null>(null);
  const pairs = initialPairs && initialPairs.length ? initialPairs : ['BTCTRY', 'BTCUSDT'];

  useEffect(() => {
    markStatus('connecting');

    const url = process.env.NEXT_PUBLIC_WS_BTCTURK || 'wss://ws-feed-pro.btcturk.com';
    const push = rafBatch((batch: any[]) => { batch.forEach(upsert); markStatus('healthy'); });
    const ws = new BtcturkWS(url, pairs, (e) => {
      if (e.type === 'open') inc('spark_ws_btcturk_reconnects_total');
      if (e.type === 'ticker') {
        useMarketStore.getState().onWsMessage();
        inc('spark_ws_btcturk_msgs_total');
        setLastTs(e.ts);
        setGauge('spark_ws_staleness_seconds', Math.max(0, (Date.now() - e.ts) / 1000));
        push({ symbol: e.pair, price: e.last, bid: e.bid, ask: e.ask, ts: e.ts, source: 'btcturk' });
      }
    });
    wsRef.current = ws;
    ws.connect();

    const id = setInterval(() => {
      useMarketStore.getState().tickStaleness();
      const ts = ws.lastMessageTs;
      if (ts) setGauge('spark_ws_staleness_seconds', Math.max(0, (Date.now() - ts) / 1000));
    }, 1000);

    return () => { clearInterval(id); ws.dispose(); wsRef.current = null; markStatus('down'); };
  }, [upsert, markStatus, setLastTs]);

  useEffect(() => {
    if (!wsRef.current) return;
    if (paused) wsRef.current.pause(pairs);
    else wsRef.current.resume(pairs);
  }, [paused]);

  return <>{children}</>;
}

