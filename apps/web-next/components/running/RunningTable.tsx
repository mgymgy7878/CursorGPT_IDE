'use client';

import React, { useRef } from 'react';
import { formatCurrency, getValueColorClass } from '@/lib/utils/currency';
import { useFlashHighlight } from '@/lib/utils/flash-highlight';

export type StrategyStatus = 'running' | 'paused' | 'stopped';

export interface RunningStrategy {
  id: string;
  name: string;
  status: StrategyStatus;
  pnlUSD: number;
  trades: number;
  capitalUSD: number;
  startedAt: string;
}

export interface RunningTableProps {
  strategies: RunningStrategy[];
  onTogglePause?: (id: string) => void;
  onStop?: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  running: { dot: 'bg-success', label: 'Çalışıyor', icon: '🟢' },
  paused: { dot: 'bg-warning', label: 'Duraklatıldı', icon: '🟠' },
  stopped: { dot: 'bg-danger', label: 'Durduruldu', icon: '🔴' },
};

function StrategyRow({
  strategy,
  onTogglePause,
  onStop,
}: {
  strategy: RunningStrategy;
  onTogglePause?: (id: string) => void;
  onStop?: (id: string) => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  // Flash highlight when PnL changes
  useFlashHighlight(rowRef, strategy.pnlUSD, {
    color: strategy.pnlUSD >= 0 ? 'success' : 'danger',
    duration: 1000,
    enabled: true,
  });

  const config = STATUS_CONFIG[strategy.status];

  return (
    <tr
      ref={rowRef}
      className="hover:bg-bg-card-hover transition-colors"
      data-testid={`row-${strategy.id}`}
    >
      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} aria-hidden="true" />
          <span className="text-sm text-text-base">{config.label}</span>
        </div>
      </td>

      {/* Strategy Name */}
      <td className="px-4 py-3 text-sm font-medium text-text-strong" scope="row">
        {strategy.name}
      </td>

      {/* PnL */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold tabular ${getValueColorClass(strategy.pnlUSD)}`}>
          {formatCurrency(strategy.pnlUSD, { showPositiveSign: true, decimals: 2 })}
        </span>
      </td>

      {/* Trades */}
      <td className="px-4 py-3 text-right text-sm text-text-base tabular">
        {strategy.trades}
      </td>

      {/* Capital */}
      <td className="px-4 py-3 text-right text-sm text-text-base tabular">
        {formatCurrency(strategy.capitalUSD, { decimals: 0 })}
      </td>

      {/* Started At */}
      <td className="px-4 py-3 text-sm text-text-base">
        {strategy.startedAt}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {strategy.status !== 'stopped' && onTogglePause && (
            <button
              onClick={() => onTogglePause(strategy.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                strategy.status === 'paused'
                  ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                  : 'bg-bg-card-hover text-text-base border-border hover:bg-bg-card'
              }`}
              aria-pressed={strategy.status === 'paused'}
              data-testid={`btn-toggle-${strategy.id}`}
            >
              {strategy.status === 'paused' ? '▶ Devam' : 'II Duraklat'}
            </button>
          )}
          {onStop && (
            <button
              onClick={() => onStop(strategy.id)}
              className="px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded hover:bg-danger/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={strategy.status === 'stopped'}
              data-testid={`btn-stop-${strategy.id}`}
            >
              ■ Durdur
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Running strategies table
 * Real-time updates with flash highlights on PnL changes
 */
export function RunningTable({
  strategies,
  onTogglePause,
  onStop,
  isLoading = false,
}: RunningTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-bg-card-hover rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-bg-card-hover rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-text-muted">Çalışan strateji bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden" data-testid="table-running">
      <table className="w-full">
        <thead className="bg-bg-card-hover border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Durum
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Strateji
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              PnL
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              İşlem
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Sermaye
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Başlangıç
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Aksiyonlar
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {strategies.map((strategy) => (
            <StrategyRow
              key={strategy.id}
              strategy={strategy}
              onTogglePause={onTogglePause}
              onStop={onStop}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

