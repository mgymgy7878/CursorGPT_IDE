'use client';
import { useEffect, useState } from "react";

interface PortfolioData {
  totalNotional: number;
  realizedPnl: number;
  unrealizedPnl: number;
  bySymbol: Array<{
    symbol: string;
    notional: number;
    pnl: number;
    side: 'long' | 'short';
  }>;
  risk: {
    exposurePct: number;
    leverageEst: number;
    positions: number;
  };
  ts: string;
}

interface PortfolioResponse {
  ok: boolean;
  source: 'executor' | 'evidence' | 'none';
  data?: PortfolioData;
}

export default function PortfolioSummary() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'executor' | 'evidence' | 'none'>('none');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/public/portfolio/summary', {
        cache: 'no-store'
      });
      const result: PortfolioResponse = await response.json();
      
      if (result.ok && result.data) {
        setData(result.data);
        setSource(result.source);
        setError(null);
      } else {
        setError('Veri alınamadı');
        setSource('none');
      }
    } catch (err) {
      setError('Bağlantı hatası');
      setSource('none');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10 saniye
    return () => clearInterval(interval);
  }, []);

  const isHealthy = source === 'executor' || (source === 'evidence' && process.env.NEXT_PUBLIC_UI_BUILDER === 'true');

  if (loading) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="h2">Portföy</div>
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

  if (error || !data) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="h2">Portföy</div>
          <div className="chips">
            <span className="chip error">DEGRADED</span>
            <span className="chip info">src:{source}</span>
          </div>
        </div>
        <div className="card-pad">
          <div className="text-zinc-400 text-sm">
            {error || 'Portföy verisi mevcut değil'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="h2">Portföy</div>
        <div className="chips">
          <span className={`chip ${isHealthy ? 'success' : 'error'}`}>
            {isHealthy ? 'HEALTHY' : 'DEGRADED'}
          </span>
          <span className="chip info">src:{source}</span>
        </div>
      </div>
      <div className="card-pad">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-zinc-400">Toplam Değer</div>
            <div className="text-lg font-semibold">
              ${data.totalNotional.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-400">Toplam P&L</div>
            <div className={`text-lg font-semibold ${data.realizedPnl + data.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${(data.realizedPnl + data.unrealizedPnl).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Risk Metrikleri</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-zinc-500">Maruziyet</div>
              <div>{data.risk.exposurePct.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-zinc-500">Kaldıraç</div>
              <div>{data.risk.leverageEst.toFixed(1)}x</div>
            </div>
            <div>
              <div className="text-zinc-500">Pozisyon</div>
              <div>{data.risk.positions}</div>
            </div>
          </div>
        </div>

        {data.bySymbol.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-zinc-400 mb-2">Aktif Pozisyonlar</div>
            <div className="space-y-1">
              {data.bySymbol.slice(0, 3).map((pos, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className={pos.side === 'long' ? 'text-green-400' : 'text-red-400'}>
                    {pos.symbol} ({pos.side})
                  </span>
                  <span className={pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${pos.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 