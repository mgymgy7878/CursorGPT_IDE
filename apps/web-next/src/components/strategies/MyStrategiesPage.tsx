/**
 * MyStrategiesPage - Refactored with MetricRibbon + DenseStrategiesTable
 *
 * Figma parity: TradingView/terminal density
 */

'use client';

import { useState } from 'react';
import { MetricRibbon } from '@/components/ui/MetricRibbon';
import { FilterBar } from '@/components/ui/FilterBar';
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';
import { StrategyRow } from '@/components/strategies/DenseStrategiesTable';
import { CompactPageHeader } from '@/components/core/CompactPageHeader';

// Deterministic mock data (fixture)
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

const MOCK_METRICS = [
  { label: '7d PnL', value: '$4,101.25', delta: { value: '+12.5%', isPositive: true } },
  { label: 'Win Rate 30d', value: '65.2%', delta: { value: '+2.1%', isPositive: true } },
  { label: 'Sharpe 30d', value: '1.98', delta: { value: '+0.15', isPositive: true } },
  { label: 'Max DD', value: '-8.5%', delta: { value: '-1.2%', isPositive: false } },
  { label: 'Open Positions', value: '12', unit: '' },
  { label: 'Risk Used', value: '65%', unit: '' },
];

export default function MyStrategiesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [marketFilter, setMarketFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredStrategies = MOCK_STRATEGIES.filter((s) => {
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

  return (
    <div className="space-y-3">
      <CompactPageHeader
        title="Stratejilerim"
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
        columns={['Strategy', 'Market', 'Category', 'Lev', '24h P&L', '7d P&L', 'WinRate 30d', 'Sharpe 30d', 'Risk', 'Status', 'Actions']}
        data={filteredStrategies}
        variant="my-strategies"
        onEdit={(id) => console.log('Edit', id)}
        onDelete={(id) => console.log('Delete', id)}
        onStatusChange={(id, status) => console.log('Status change', id, status)}
      />
    </div>
  );
}

