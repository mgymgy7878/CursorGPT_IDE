/**
 * RunningStrategiesPage - Refactored with MetricRibbon + DenseStrategiesTable
 *
 * Figma parity: TradingView/terminal density
 */

'use client';

import { useState, useEffect } from 'react';
import { MetricRibbon } from '@/components/ui/MetricRibbon';
import { FilterBar } from '@/components/ui/FilterBar';
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';
import { StrategyRow } from '@/components/strategies/DenseStrategiesTable';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { uiCopy } from '@/lib/uiCopy';
import { cn } from '@/lib/utils';
import { ClientTime } from '@/components/common/ClientTime';
import Link from 'next/link';
import { useExecutorHealth } from '@/hooks/useExecutorHealth';

// Deterministic mock data (fixture)
const MOCK_RUNNING: StrategyRow[] = [
  {
    id: '1',
    strategy: 'BTC Mean Rev',
    market: 'Crypto',
    mode: 'live',
    openPositions: 3,
    exposure: 15000,
    pnl24h: 450.50,
    pnl7d: 1250.75,
    risk: 'Medium',
    status: 'running',
    health: 'ok',
  },
  {
    id: '2',
    strategy: 'Gold Trend',
    market: 'Commodities',
    mode: 'shadow',
    openPositions: 2,
    exposure: 8500,
    pnl24h: 1200.00,
    pnl7d: 3200.50,
    risk: 'Low',
    status: 'running',
    health: 'ok',
  },
  {
    id: '3',
    strategy: 'ETH Scalp',
    market: 'Crypto',
    mode: 'live',
    openPositions: 5,
    exposure: 12000,
    pnl24h: -120.25,
    pnl7d: -350.00,
    risk: 'High',
    status: 'running',
    health: 'degraded',
  },
];

// PATCH W.4: uiCopy'den metrik label'ları
// PATCH W.5: Delta değerleri number olarak (formatSignedPct ile formatlanacak)
const MOCK_METRICS = [
  { label: uiCopy.metrics.totalPnl24h, value: '$1,530.25', delta: { value: 8.2, isPositive: true } },
  { label: uiCopy.metrics.totalPnl7d, value: '$4,101.25', delta: { value: 12.5, isPositive: true } },
  { label: uiCopy.metrics.openPositions, value: '10', unit: '' },
  { label: uiCopy.metrics.totalExposure, value: '$35,500', unit: '' },
  { label: uiCopy.metrics.riskUsed, value: '68%', unit: '' },
  // PATCH W.5: Health status uiCopy'den
  { label: uiCopy.metrics.health, value: `2 ${uiCopy.health.ok} / 1 ${uiCopy.health.degraded}`, unit: '' },
];

export default function RunningStrategiesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [modeFilter, setModeFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const executorHealth = useExecutorHealth();

  // Fetch strategies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [strategiesRes, positionsRes, tradesRes] = await Promise.allSettled([
          fetch('/api/strategies?status=active&limit=20', { cache: 'no-store' }),
          fetch('/api/positions/open?limit=6', { cache: 'no-store' }),
          fetch('/api/trades/recent?limit=10', { cache: 'no-store' }),
        ]);

        if (strategiesRes.status === 'fulfilled' && strategiesRes.value.ok) {
          const data = await strategiesRes.value.json();
          if (data.strategies) {
            const mapped: StrategyRow[] = data.strategies.map((s: any) => ({
              id: s.id,
              strategy: s.name,
              market: 'Crypto', // TODO: extract from params
              mode: 'live', // TODO: determine from strategy config
              openPositions: s._count?.positions || 0,
              exposure: 0, // TODO: calculate from positions
              pnl24h: 0, // TODO: calculate from trades
              pnl7d: 0, // TODO: calculate from trades
              risk: 'Medium', // TODO: calculate from strategy params
              status: s.status === 'active' ? 'running' : s.status,
              health: 'ok', // TODO: calculate from health checks
            }));
            setStrategies(mapped);
          }
        }

        if (positionsRes.status === 'fulfilled' && positionsRes.value.ok) {
          const data = await positionsRes.value.json();
          if (data.positions) {
            setPositions(data.positions);
          }
        }

        if (tradesRes.status === 'fulfilled' && tradesRes.value.ok) {
          const data = await tradesRes.value.json();
          if (data.trades) {
            setTrades(data.trades);
          }
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredStrategies = strategies.filter((s) => {
    if (searchValue && !s.strategy.toLowerCase().includes(searchValue.toLowerCase())) return false;
    if (modeFilter && s.mode !== modeFilter) return false;
    if (healthFilter && s.health !== healthFilter) return false;
    return true;
  });

  // PATCH W.5: Filter chip'leri uiCopy'den
  const filterChips = [
    { id: 'mode-live', label: uiCopy.mode.live, active: modeFilter === 'live', onClick: () => setModeFilter(modeFilter === 'live' ? null : 'live') },
    { id: 'mode-shadow', label: uiCopy.mode.shadow, active: modeFilter === 'shadow', onClick: () => setModeFilter(modeFilter === 'shadow' ? null : 'shadow') },
    { id: 'health-ok', label: uiCopy.health.ok, active: healthFilter === 'ok', onClick: () => setHealthFilter(healthFilter === 'ok' ? null : 'ok') },
    { id: 'health-degraded', label: uiCopy.health.degraded, active: healthFilter === 'degraded', onClick: () => setHealthFilter(healthFilter === 'degraded' ? null : 'degraded') },
  ];

  // PATCH SCROLL-AUDIT: Alt boşluk hissi düzeltmesi - bottom padding kontrolü
  return (
    <PageContainer size="wide">
      <div className="space-y-3 pb-4">
        {/* UI-1: H1 sr-only (özet satırı + filtre barı zaten başlık gibi) */}
        <PageHeader
          title="Çalışan Stratejiler"
          subtitle="Aktif stratejileri görüntüle ve yönet"
          className="sr-only"
        />

      {/* PATCH R: Metric Ribbon - tek satır, wrap yok, yatay scroll */}
      <div className="mb-3 overflow-x-auto" style={{ height: 'var(--summary-strip-py, 10px) * 2 + 20px' }}>
        <MetricRibbon items={MOCK_METRICS} className="whitespace-nowrap" />
      </div>

      {/* PATCH R: Filter Bar - height token */}
      <div className="mb-3" style={{ height: 'var(--filters-h, 36px)' }}>
        <FilterBar
          chips={filterChips}
          searchPlaceholder="Strateji ara..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      {/* Dense Table - PATCH Q: Türkçeleştirme */}
      {/* PATCH 5: Table maxRows + footer action */}
      <div className="mb-3">
        <DenseStrategiesTable
          columns={['Strateji', 'Piyasa', 'Mod', 'Açık Poz.', 'Maruziyet', 'PnL 24h', 'PnL 7d', 'Risk', 'Sağlık', 'Durum', 'İşlemler']}
          data={filteredStrategies.slice(0, 6)}
          variant="running-strategies"
          onStatusChange={async (id, action) => {
            // Check executor health before allowing actions
            if (!executorHealth.healthy) {
              alert(`Executor servisi şu anda kullanılamıyor (${executorHealth.status}). Lütfen servisin çalıştığından emin olun.`);
              return;
            }

            const actionMap: Record<string, string> = {
              start: 'start',
              pause: 'pause',
              stop: 'stop',
            };
            const mappedAction = actionMap[action] || action;

            if (!confirm(`Stratejiyi ${mappedAction === 'start' ? 'başlat' : mappedAction === 'pause' ? 'durdur' : 'sonlandır'}mak istediğinize emin misiniz?`)) {
              return;
            }

            // Get current strategy status for audit
            const currentStrategy = strategies.find(s => s.id === id);
            const prevStatus = currentStrategy?.status || 'unknown';

            try {
              const res = await fetch(`/api/strategies/${id}/${mappedAction}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actor: 'user',
                  prevStatus, // Track status transition
                }),
              });

              if (res.ok) {
                // Refresh data after delay to allow backend processing
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } else {
                const data = await res.json().catch(() => ({}));
                alert(`İşlem başarısız oldu: ${data.error || 'Bilinmeyen hata'}`);
              }
            } catch (e) {
              alert('Hata oluştu: ' + (e instanceof Error ? e.message : 'Bağlantı hatası'));
            }
          }}
        />
        {filteredStrategies.length > 6 && (
          <div className="mt-2 text-center border-t border-neutral-800 pt-2">
            <Link
              href="/strategies/all"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Tümünü gör ({filteredStrategies.length - 6} daha)
            </Link>
          </div>
        )}
      </div>

      {/* PATCH 5: Alt paneller - Open Positions + Recent Orders */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Sol: Open Positions (top 5) */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs font-medium text-neutral-300 mb-2">Açık Pozisyonlar (Top 5)</div>
          <div className="space-y-1.5">
            {positions.length === 0 ? (
              <div className="text-[10px] text-neutral-500 text-center py-4">Açık pozisyon yok</div>
            ) : (
              positions.slice(0, 5).map((pos, i) => {
                const entryPrice = formatCurrency(parseFloat(pos.avgPrice));
                const size = pos.quantity;
                return (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-neutral-900/30 border border-neutral-800">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-medium text-neutral-200">{pos.symbol}</span>
                        <span className={cn(
                          'text-[9px] px-1 py-0.5 rounded',
                          pos.side === 'long'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        )}>
                          {pos.side.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[9px] text-neutral-500">
                        {size} @ {entryPrice} · {pos.strategy?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-2 text-center">
            <button
              onClick={() => {/* TODO: Open positions modal */}}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Tüm pozisyonları gör →
            </button>
          </div>
        </div>

        {/* Sağ: Recent Orders (top 5) + Degrade Reasons */}
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs font-medium text-neutral-300 mb-2">Son Emirler / Fill'ler (Top 5)</div>
            <div className="space-y-1.5">
              {trades.length === 0 ? (
                <div className="text-[10px] text-neutral-500 text-center py-4">Son emir yok</div>
              ) : (
                trades.slice(0, 5).map((trade, i) => {
                  const price = formatCurrency(parseFloat(trade.price));
                  const timestamp = new Date(trade.createdAt || trade.filledAt).getTime();
                  return (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-neutral-900/30 border border-neutral-800">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium text-neutral-200">{trade.symbol}</span>
                          <span className={cn(
                            'text-[9px] px-1 py-0.5 rounded',
                            trade.side === 'buy'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          )}>
                            {trade.side.toUpperCase()}
                          </span>
                          <span className={cn(
                            'text-[9px] px-1 py-0.5 rounded',
                            trade.status === 'filled'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          )}>
                            {trade.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[9px] text-neutral-500">
                          {trade.quantity} @ {price} · <ClientTime value={timestamp} format="relative" minWidth="10ch" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={() => {/* TODO: Open orders modal */}}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Tüm emirleri gör →
              </button>
            </div>
          </div>

          {/* Degrade Reasons */}
          {filteredStrategies.some(s => s.health === 'degraded') && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="text-xs font-medium text-amber-400 mb-2">Degrade Nedenleri</div>
              <div className="space-y-1 text-[10px] text-amber-300/80">
                <div>• ETH Scalp: Yüksek drawdown (-350.0% 7g)</div>
                <div>• Risk limiti aşıldı (5/5 pozisyon)</div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </PageContainer>
  );
}

