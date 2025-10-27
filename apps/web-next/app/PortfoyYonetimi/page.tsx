'use client';
import { useEffect, useState } from 'react';
import { fmtCur, fmtNum, fmtPct, fmtDate } from '@/lib/format';

type Position = {
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  value: number;
};

type PortfolioData = {
  positions: Position[];
  totalValue: number;
  totalPnl: number;
  reason?: string;
  message?: string;
};

export default function Page() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/portfolio/positions');
        const data = await response.json();
        setPortfolioData(data);
        setError(null);
      } catch (e) {
        setError('Portfolio verisi alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Portföy Yönetimi</h1>
        <p className="mt-2 text-neutral-300">Yükleniyor...</p>
      </main>
    );
  }

  const hasKeys = !portfolioData?.reason || portfolioData.reason !== 'no-keys';
  const hasPositions = portfolioData?.positions && portfolioData.positions.length > 0;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portföy Yönetimi</h1>
        <p className="mt-2 text-neutral-300">Açık pozisyonlar, maruziyet ve risk kontrolleri burada.</p>
      </div>

      {/* Portfolio Summary */}
      {hasKeys && portfolioData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="text-sm text-neutral-400">Toplam Değer</div>
            <div className="text-2xl font-bold">{fmtCur(portfolioData.totalValue)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="text-sm text-neutral-400">Toplam PnL</div>
            <div className={`text-2xl font-bold ${portfolioData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtCur(portfolioData.totalPnl)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="text-sm text-neutral-400">Açık Pozisyon</div>
            <div className="text-2xl font-bold">{Array.isArray(portfolioData?.positions) ? portfolioData.positions.length : 0}</div>
          </div>
        </div>
      )}

      {/* Positions Table */}
      {hasKeys && hasPositions ? (
        <div className="rounded-2xl border border-white/10 p-4">
          <h3 className="text-lg font-semibold mb-4">Açık Pozisyonlar</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2">Sembol</th>
                  <th className="text-left py-2">Yön</th>
                  <th className="text-left py-2">Miktar</th>
                  <th className="text-left py-2">Giriş Fiyatı</th>
                  <th className="text-left py-2">Güncel Fiyat</th>
                  <th className="text-left py-2">PnL</th>
                  <th className="text-left py-2">PnL %</th>
                  <th className="text-left py-2">Değer</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((pos, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 font-mono">{pos.symbol}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pos.side === 'LONG' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-2">{fmtNum(pos.size)}</td>
                    <td className="py-2">{fmtCur(pos.entryPrice)}</td>
                    <td className="py-2">{fmtCur(pos.currentPrice)}</td>
                    <td className={`py-2 ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtCur(pos.pnl)}
                    </td>
                    <td className={`py-2 ${pos.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtPct(pos.pnlPercent)}
                    </td>
                    <td className="py-2">{fmtCur(pos.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : hasKeys ? (
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-neutral-300 mb-2">Açık pozisyon yok.</div>
          <p className="text-sm text-neutral-400">Aktif stratejiler çalıştırdığınızda pozisyonlar burada görünecek.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-neutral-300 mb-2">Exchange bağlantısı yok.</div>
          <p className="text-sm text-neutral-400 mb-4">
            {portfolioData?.message || 'Exchange API anahtarları yapılandırılmamış'}
          </p>
          <a href="/ayarlar" className="inline-flex items-center rounded-xl bg-emerald-600/90 px-3 py-2 text-white">
            Borsa bağla / API anahtarı ekle
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="text-red-400">Hata: {error}</div>
        </div>
      )}
    </main>
  );
}
