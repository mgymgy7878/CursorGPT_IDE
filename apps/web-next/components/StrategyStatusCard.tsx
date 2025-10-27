'use client';
import { useEffect, useState } from "react";

interface StrategyData {
  name: string;
  mode: 'grid' | 'trend' | 'scalp' | 'stopped';
  symbol: string;
  lastSignal: string;
  pnl: number;
  trades: number;
  winRate: number;
  ts: string;
}

export default function StrategyStatusCard() {
  const [data, setData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    const mockData: StrategyData = {
      name: 'RSI+MACD Strategy',
      mode: 'trend',
      symbol: 'BTCUSDT',
      lastSignal: 'BUY',
      pnl: 1250.75,
      trades: 42,
      winRate: 0.65,
      ts: new Date().toISOString()
    };

    setData(mockData);
    setLoading(false);

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      setData(prev => prev ? {
        ...prev,
        pnl: prev.pnl + (Math.random() - 0.5) * 100,
        trades: prev.trades + Math.floor(Math.random() * 2),
        ts: new Date().toISOString()
      } : mockData);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'grid': return 'text-blue-400';
      case 'trend': return 'text-green-400';
      case 'scalp': return 'text-purple-400';
      case 'stopped': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case 'grid': return 'Grid';
      case 'trend': return 'Trend';
      case 'scalp': return 'Scalp';
      case 'stopped': return 'Durduruldu';
      default: return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="h2">Strateji</div>
          <div className="chips">
            <span className="chip loading">Yükleniyor...</span>
          </div>
        </div>
        <div className="card-pad">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
            <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="h2">Strateji</div>
          <div className="chips">
            <span className="chip error">INACTIVE</span>
          </div>
        </div>
        <div className="card-pad">
          <div className="text-zinc-400 text-sm">
            Aktif strateji bulunamadı
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="h2">Strateji</div>
        <div className="chips">
          <span className="chip success">ACTIVE</span>
          <span className={`chip info ${getModeColor(data.mode)}`}>
            {getModeText(data.mode)}
          </span>
        </div>
      </div>
      <div className="card-pad">
        <div className="space-y-3">
          <div>
            <div className="text-sm text-zinc-400">Strateji Adı</div>
            <div className="font-semibold">{data.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-400">Sembol</div>
              <div className="font-mono">{data.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Son Sinyal</div>
              <div className={`font-semibold ${data.lastSignal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {data.lastSignal}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-zinc-400">P&L</div>
              <div className={`font-semibold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${data.pnl.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">İşlem</div>
              <div className="font-semibold">{data.trades}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Kazanma</div>
              <div className="font-semibold">{(data.winRate * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="text-xs text-zinc-500">
            Son güncelleme: {new Date(data.ts).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
} 