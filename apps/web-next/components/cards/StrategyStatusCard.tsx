'use client';

import { useEffect, useState } from "react";

type Strategy = {
  active: boolean;
  name: string;
  mode: 'grid' | 'trend' | 'scalp' | 'stop';
  symbol: string;
  lastSignal: string;
  pnl: number;
  trades: number;
  winRate: number;
};

export default function StrategyStatusCard() {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Mock strategy data - gerçek API'ye bağlanacak
        const mockStrategy: Strategy = {
          active: true,
          name: 'RSI Grid Strategy',
          mode: 'grid',
          symbol: 'BTCUSDT',
          lastSignal: 'BUY',
          pnl: 1250.75,
          trades: 42,
          winRate: 0.68
        };
        
        if (alive) {
          setStrategy(mockStrategy);
          setLoading(false);
        }
      } catch {
        if (alive) {
          setStrategy(null);
          setLoading(false);
        }
      }
    };
    load();
    const id = setInterval(load, 5000); // 5s refresh
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (loading) return <div className="animate-pulse text-zinc-400">Yükleniyor…</div>;
  if (!strategy) return <div className="text-red-400">Strateji verisi alınamadı</div>;

  return (
    <div className="space-y-3">
      <div className="chips">
        <span className={`chip ${strategy.active ? 'ok' : 'warn'}`}>
          {strategy.active ? 'ACTIVE' : 'INACTIVE'}
        </span>
        <span className="chip">{strategy.mode}</span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="subtle text-xs">Strategy</span>
          <div className="font-semibold text-sm">{strategy.name}</div>
        </div>
        
        <div>
          <span className="subtle text-xs">Symbol</span>
          <div className="font-semibold text-sm">{strategy.symbol}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="subtle">P&L</span>
          <div className={`font-semibold ${strategy.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${strategy.pnl.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="subtle">Trades</span>
          <div className="font-semibold">{strategy.trades}</div>
        </div>
        <div>
          <span className="subtle">Win Rate</span>
          <div className="font-semibold">{(strategy.winRate * 100).toFixed(1)}%</div>
        </div>
        <div>
          <span className="subtle">Last Signal</span>
          <div className={`font-semibold ${strategy.lastSignal === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
            {strategy.lastSignal}
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Son güncelleme: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 