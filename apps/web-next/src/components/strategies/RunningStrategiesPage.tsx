/**
 * RunningStrategiesPage - Refactored with MetricRibbon + DenseStrategiesTable
 *
 * Figma parity: TradingView/terminal density
 */

'use client';

import { useState } from 'react';
import { MetricRibbon } from '@/components/ui/MetricRibbon';
import { FilterBar } from '@/components/ui/FilterBar';
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';
import { StrategyRow } from '@/components/strategies/DenseStrategiesTable';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/common/PageHeader';

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

const MOCK_METRICS = [
  { label: 'Total PnL 24h', value: '$1,530.25', delta: { value: '+8.2%', isPositive: true } },
  { label: 'Total PnL 7d', value: '$4,101.25', delta: { value: '+12.5%', isPositive: true } },
  { label: 'Open Positions', value: '10', unit: '' },
  { label: 'Total Exposure', value: '$35,500', unit: '' },
  { label: 'Risk Used', value: '68%', unit: '' },
  { label: 'Health', value: '2 OK / 1 Degraded', unit: '' },
];

export default function RunningStrategiesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [modeFilter, setModeFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);

  const filteredStrategies = MOCK_RUNNING.filter((s) => {
    if (searchValue && !s.strategy.toLowerCase().includes(searchValue.toLowerCase())) return false;
    if (modeFilter && s.mode !== modeFilter) return false;
    if (healthFilter && s.health !== healthFilter) return false;
    return true;
  });

  const filterChips = [
    { id: 'mode-live', label: 'Live', active: modeFilter === 'live', onClick: () => setModeFilter(modeFilter === 'live' ? null : 'live') },
    { id: 'mode-shadow', label: 'Shadow', active: modeFilter === 'shadow', onClick: () => setModeFilter(modeFilter === 'shadow' ? null : 'shadow') },
    { id: 'health-ok', label: 'OK', active: healthFilter === 'ok', onClick: () => setHealthFilter(healthFilter === 'ok' ? null : 'ok') },
    { id: 'health-degraded', label: 'Degraded', active: healthFilter === 'degraded', onClick: () => setHealthFilter(healthFilter === 'degraded' ? null : 'degraded') },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Çalışan Stratejiler"
        subtitle="Aktif stratejileri görüntüle ve yönet"
      />

      {/* PATCH R: Metric Ribbon - tek satır, wrap yok, yatay scroll */}
      <div className="mb-4 overflow-x-auto" style={{ height: 'var(--summary-strip-py, 10px) * 2 + 20px' }}>
        <MetricRibbon items={MOCK_METRICS} className="whitespace-nowrap" />
      </div>

      {/* PATCH R: Filter Bar - height token */}
      <div className="mb-4" style={{ height: 'var(--filters-h, 36px)' }}>
        <FilterBar
          chips={filterChips}
          searchPlaceholder="Strateji ara..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      {/* Dense Table */}
      <DenseStrategiesTable
        columns={['Strategy', 'Market', 'Mode', 'Open Pos', 'Exposure', 'PnL 24h', 'PnL 7d', 'Risk', 'Health', 'Status', 'Actions']}
        data={filteredStrategies}
        variant="running-strategies"
        onStatusChange={(id, status) => console.log('Status change', id, status)}
      />
    </div>
  );
}

