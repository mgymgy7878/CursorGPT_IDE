/**
 * MyStrategiesPage - Refactored with MetricRibbon + DenseStrategiesTable
 *
 * Figma parity: TradingView/terminal density
 */

'use client';

import { useState, useEffect } from 'react';
import { MetricRibbon } from '@/components/ui/MetricRibbon';
import { FilterBar } from '@/components/ui/FilterBar';
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';
import { StrategyRow } from '@/components/strategies/DenseStrategiesTable';
import { CompactPageHeader } from '@/components/core/CompactPageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { uiCopy } from '@/lib/uiCopy';

// Deterministic mock data (fixture) - fallback
const MOCK_STRATEGIES: StrategyRow[] = [
  {
    id: '1',
    strategy: 'BTC Mean Rev',
    market: 'Crypto',
    category: 'Mean Reversion',
    leverage: 3,
    pnl24h: 450.50,
    pnl7d: 1250.75,
    winRate30d: 0.65,
    sharpe30d: 1.85,
    risk: 'Medium',
    status: 'active',
  },
  {
    id: '2',
    strategy: 'Gold Trend',
    market: 'Commodities',
    category: 'Trend Following',
    leverage: 2,
    pnl24h: 1200.00,
    pnl7d: 3200.50,
    winRate30d: 0.72,
    sharpe30d: 2.15,
    risk: 'Low',
    status: 'active',
  },
  {
    id: '3',
    strategy: 'ETH Scalp',
    market: 'Crypto',
    category: 'Scalping',
    leverage: 5,
    pnl24h: -120.25,
    pnl7d: -350.00,
    winRate30d: 0.45,
    sharpe30d: 0.95,
    risk: 'High',
    status: 'paused',
  },
];

// PATCH W.4: uiCopy'den metrik label'ları
const MOCK_METRICS = [
  { label: uiCopy.metrics.pnl7d, value: '$4,101.25', delta: { value: '+12.5%', isPositive: true } },
  { label: uiCopy.metrics.winRate30d, value: '65.2%', delta: { value: '+2.1%', isPositive: true } },
  { label: uiCopy.metrics.sharpe30d, value: '1.98', delta: { value: '+0.15', isPositive: true } },
  { label: uiCopy.metrics.maxDD, value: '-8.5%', delta: { value: '-1.2%', isPositive: false } },
  { label: uiCopy.metrics.openPositions, value: '12', unit: '' },
  { label: uiCopy.metrics.riskUsed, value: '65%', unit: '' },
];

export default function MyStrategiesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [marketFilter, setMarketFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch strategies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/strategies?limit=20', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.strategies) {
            const mapped: StrategyRow[] = data.strategies.map((s: any) => ({
              id: s.id,
              strategy: s.name,
              market: 'Crypto', // TODO: extract from params
              category: 'Strategy', // TODO: extract from params
              leverage: 1, // TODO: extract from params
              pnl24h: 0, // TODO: calculate from trades
              pnl7d: 0, // TODO: calculate from trades
              winRate30d: 0, // TODO: calculate from trades
              sharpe30d: 0, // TODO: calculate from backtests
              risk: 'Medium', // TODO: calculate from strategy params
              status: s.status,
            }));
            setStrategies(mapped.length > 0 ? mapped : MOCK_STRATEGIES);
          } else {
            setStrategies(MOCK_STRATEGIES);
          }
        } else {
          setStrategies(MOCK_STRATEGIES);
        }
      } catch (e) {
        console.error('Error fetching strategies:', e);
        setStrategies(MOCK_STRATEGIES);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStrategies = strategies.filter((s) => {
    if (searchValue && !s.strategy.toLowerCase().includes(searchValue.toLowerCase())) return false;
    if (marketFilter && s.market !== marketFilter) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const filterChips = [
    { id: 'market-crypto', label: 'Crypto', active: marketFilter === 'Crypto', onClick: () => setMarketFilter(marketFilter === 'Crypto' ? null : 'Crypto') },
    { id: 'market-fx', label: 'FX', active: marketFilter === 'FX', onClick: () => setMarketFilter(marketFilter === 'FX' ? null : 'FX') },
    { id: 'status-running', label: 'Running', active: statusFilter === 'active', onClick: () => setStatusFilter(statusFilter === 'active' ? null : 'active') },
    { id: 'status-paused', label: 'Paused', active: statusFilter === 'paused', onClick: () => setStatusFilter(statusFilter === 'paused' ? null : 'paused') },
  ];

  // PATCH SCROLL-AUDIT: Alt boşluk hissi düzeltmesi - bottom padding kontrolü
  return (
    <PageContainer size="wide">
      <div className="space-y-3 pb-4">
        {/* UI-1: H1 sr-only (özet satırı + filtre barı zaten başlık gibi) */}
        <CompactPageHeader
          title="Stratejilerim"
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

        {/* Dense Table */}
        <DenseStrategiesTable
          columns={[
            uiCopy.table.strategy,
            uiCopy.table.market,
            uiCopy.table.category,
            uiCopy.table.leverage,
            uiCopy.table.pnl24hFull,
            uiCopy.table.pnl7dFull,
            uiCopy.table.winRate30d,
            uiCopy.table.sharpe30d,
            uiCopy.table.risk,
            uiCopy.table.status,
            uiCopy.table.actions,
          ]}
          data={filteredStrategies}
          variant="my-strategies"
          onEdit={(id) => console.log('Edit', id)}
          onDelete={(id) => console.log('Delete', id)}
          onStatusChange={(id, status) => console.log('Status change', id, status)}
        />
      </div>
    </PageContainer>
  );
}

