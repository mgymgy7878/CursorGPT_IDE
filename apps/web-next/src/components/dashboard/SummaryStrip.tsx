'use client';

import { formatCurrency } from '@/lib/format';
import { StatusDot } from '@/components/status-dot';
import type { ServiceStatus } from '@/hooks/useUnifiedStatus';
import KpiMini from '@/components/ui/KpiMini';

export interface SummaryData {
  errorBudget: number;
  api: ServiceStatus;
  ws: ServiceStatus;
  executor: ServiceStatus;
  balance: number;
  pnl24h: number;
  runningStrategies: number;
  activeAlerts: number;
}

interface SummaryStripProps {
  data: SummaryData;
}

/**
 * SummaryStrip - At-a-glance dashboard metrics
 *
 * Displays 8 key metrics in a single row:
 * - Error Budget
 * - API/WS/Executor status
 * - Portfolio balance
 * - 24h P&L
 * - Running strategies count
 * - Active alerts count
 *
 * Compact design for maximum information density
 */
export default function SummaryStrip({ data }: SummaryStripProps) {
  const {
    errorBudget,
    api,
    ws,
    executor,
    balance,
    pnl24h,
    runningStrategies,
    activeAlerts,
  } = data;

  // Mini KPI component
  const MiniKpi = ({
    title,
    value,
    status
  }: {
    title: string;
    value: string | number;
    status?: 'good' | 'warn' | 'bad' | ServiceStatus;
    dot?: boolean;
  }) => {
    const getColor = () => {
      if (!status) return 'text-neutral-300';
      if (status === 'good' || status === 'up') return 'text-green-400';
      if (status === 'warn') return 'text-amber-400';
      if (status === 'bad' || status === 'down') return 'text-red-400';
      if (status === 'unknown') return 'text-gray-400';
      return 'text-neutral-300';
    };

    return (
      <div className="bg-card/40 rounded-lg pad-sm border border-zinc-800/50">
        <div className="text-[10px] uppercase tracking-wide text-mute mb-1">
          {title}
        </div>
        <div className={`text-lg font-semibold tabular ${getColor()}`}>
          {value}
        </div>
      </div>
    );
  };

  // Status dot mini KPI
  const StatusKpi = ({
    title,
    status
  }: {
    title: string;
    status: ServiceStatus;
  }) => (
    <div className="bg-card/40 rounded-lg pad-sm border border-zinc-800/50">
      <div className="text-[10px] uppercase tracking-wide text-mute mb-1">
        {title}
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status={status} label={title} />
        <span className="text-sm font-medium capitalize text-neutral-300">
          {status === 'up' ? 'Çevrimiçi' : status === 'down' ? 'Çevrimdışı' : 'Kontrol'}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="sticky top-[var(--header-h)] z-20 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 border-b border-zinc-800/50 py-2 px-6 -mx-6 mb-2 isolation-isolate sticky-shadow"
      style={{ height: '56px' }}
    >
      <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 h-full">
        {/* Error Budget */}
        <KpiMini
          label="EB"
          value={`${errorBudget.toFixed(1)}%`}
          tone={errorBudget > 95 ? 'ok' : errorBudget > 90 ? 'warn' : 'danger'}
        />

      {/* Service Status */}
      <KpiMini label="API" value="Kontrol" dot={api} />
      <KpiMini
        label="WS"
        value={ws === 'up' ? 'Aktif' : (ws === 'unknown' && (process.env.NEXT_PUBLIC_ENV === 'dev' || process.env.NEXT_PUBLIC_MOCK === '1')) ? 'Dev Mode' : 'Çevrimdışı'}
        dot={ws}
      />
      <KpiMini label="Executor" value="Kontrol" dot={executor} />

      {/* Portfolio Metrics */}
      <MiniKpi
        title="Bakiye"
        value={formatCurrency(balance, 'tr-TR', 'USD').replace(/\s/g, '')}
      />
      <MiniKpi
        title="P&L 24h"
        value={formatCurrency(pnl24h, 'tr-TR', 'USD').replace(/\s/g, '')}
        status={pnl24h >= 0 ? 'good' : 'bad'}
      />

      {/* Activity Metrics */}
      <MiniKpi
        title="Çalışan"
        value={runningStrategies}
        status={runningStrategies > 0 ? 'good' : undefined}
      />
      <MiniKpi
        title="Uyarı"
        value={activeAlerts}
        status={activeAlerts > 0 ? 'warn' : undefined}
      />
      </div>
    </div>
  );
}

