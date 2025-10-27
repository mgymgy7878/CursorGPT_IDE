import React from 'react';
import Link from 'next/link';
import { formatCurrency, getValueColorClass } from '@/lib/utils/currency';
import { RunningStrategy } from '@/components/running/RunningTable';

export interface MiniRunningProps {
  items: RunningStrategy[];
}

/**
 * Mini running strategies widget for homepage
 * Shows top 3 strategies with PnL
 */
export function MiniRunning({ items }: MiniRunningProps) {
  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-text-strong">Çalışan Stratejiler</h2>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">Çalışan strateji bulunmuyor</p>
        ) : (
          items.slice(0, 3).map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    strategy.status === 'running'
                      ? 'bg-success'
                      : strategy.status === 'paused'
                      ? 'bg-warning'
                      : 'bg-danger'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-text-base">{strategy.name}</span>
              </div>
              <span className={`text-sm font-semibold tabular ${getValueColorClass(strategy.pnlUSD)}`}>
                {formatCurrency(strategy.pnlUSD, { showPositiveSign: true, decimals: 2 })}
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/running"
        className="block mt-4 text-sm text-accent hover:text-accent-hover transition-colors text-center"
      >
        Tümünü Gör →
      </Link>
    </section>
  );
}

