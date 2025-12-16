/**
 * DashboardGrid - Figma Parity Dashboard Layout
 *
 * Grid structure matching Figma:
 * - Top Left: Portfolio Summary (StatCard)
 * - Top Right: Market Status (MiniList)
 * - Middle Left: Active Strategies (CompactTable)
 * - Middle Right: Risk Status (RiskBar)
 * - Bottom Left: Last AI Decisions (MiniList)
 * - Bottom Right: System Health (SystemHealthCard)
 */

'use client';

import { StatCard } from '@/components/ui/StatCard';
import { MiniList } from '@/components/ui/MiniList';
import { CompactTable } from '@/components/ui/CompactTable';
import { RiskBar } from '@/components/ui/RiskBar';
import { SystemHealthCard } from '@/components/ui/SystemHealthCard';
import { Surface } from '@/components/ui/Surface';

export default function DashboardGrid() {
  // Mock data - executor kapalıyken bile aynı görünüm
  const portfolioData = {
    totalAssets: '$124,592.00',
    dailyPnL: {
      value: '+$1,240.50',
      isPositive: true,
    },
    dailyPnLLabel: 'Last 24h',
    marginLevel: '1,240%',
    marginLevelLabel: 'Healthy',
  };

  const marketData = [
    { label: 'BTC/USDT', value: '42,150.00', delta: { value: '+1.2%', isPositive: true } },
    { label: 'ETH/USDT', value: '2,250.00', delta: { value: '-0.5%', isPositive: false } },
    { label: 'SOL/USDT', value: '98.50', delta: { value: '+5.2%', isPositive: true } },
  ];

  const activeStrategies = [
    { name: 'BTC Mean Rev', market: 'Crypto', pnl: '+$450', pnlPositive: true },
    { name: 'Gold Trend', market: 'Commodities', pnl: '+$1,200', pnlPositive: true },
    { name: 'ETH Scalp', market: 'Crypto', pnl: '-$120', pnlPositive: false },
  ];

  const aiDecisions = [
    { label: 'BUY BTC/USDT', value: 'RSI Oversold condition met', delta: { value: '98% Conf.', isPositive: true } },
    { label: 'CLOSE ETH/USDT', value: 'Take profit target hit', delta: { value: '100% Conf.', isPositive: true } },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Left: Portfolio Summary - Figma parity: 3 küçük stat kutusu */}
      <Surface variant="card" className="p-4">
        <div className="text-sm font-medium text-neutral-200 mb-3">Portföy Özeti</div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Toplam Varlık"
            value={portfolioData.totalAssets}
            delta={portfolioData.dailyPnL}
            sublabel={portfolioData.dailyPnLLabel}
            className="border-0 bg-transparent p-0"
          />
          <StatCard
            label="Günlük PnL"
            value={portfolioData.dailyPnL.value}
            delta={{ value: portfolioData.dailyPnL.value, isPositive: portfolioData.dailyPnL.isPositive }}
            className="border-0 bg-transparent p-0"
          />
          <StatCard
            label="Margin Level"
            value={portfolioData.marginLevel}
            sublabel={portfolioData.marginLevelLabel}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </Surface>

      {/* Top Right: Market Status */}
      <MiniList
        title="Piyasa Durumu"
        items={marketData}
      />

      {/* Middle Left: Active Strategies */}
      <CompactTable
        title="Aktif Stratejiler"
        badge="12 Running"
        columns={[
          { header: 'Strateji', accessor: 'name' },
          { header: 'Piyasa', accessor: 'market' },
          {
            header: 'PnL',
            accessor: 'pnl',
            render: (value: string, row: any) => (
              <span className={row.pnlPositive ? 'text-emerald-400' : 'text-red-400'}>
                {value}
              </span>
            ),
          },
        ]}
        data={activeStrategies}
      />

      {/* Middle Right: Risk Status */}
      <Surface variant="card" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-neutral-200">Risk Durumu</div>
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
            Moderate
          </span>
        </div>
        <div className="space-y-4">
          <RiskBar label="Daily Drawdown" value={1.2} variant="warning" />
          <RiskBar label="Exposure" value={65} variant="default" />
        </div>
      </Surface>

      {/* Bottom Left: Last AI Decisions */}
      <MiniList
        title="Son Yapay Zeka Kararları"
        items={aiDecisions}
      />

      {/* Bottom Right: System Health */}
      <SystemHealthCard
        title="Sistem Sağlığı"
        items={[
          { label: 'API Latency', value: '12ms', status: 'healthy' },
          { label: 'Execution', value: 'Operational', status: 'healthy' },
          { label: 'Data Stream', value: 'Connected', status: 'healthy' },
        ]}
      />
    </div>
  );
}

