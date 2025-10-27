'use client';

import React from 'react';
import { formatPercent, getValueColorClass } from '@/lib/utils/currency';

export type StrategyTag = 'kripto' | 'bist' | 'hisse' | 'scalping' | 'grid' | 'spot' | 'swing';

export interface StrategyCardData {
  id: string;
  name: string;
  tags: StrategyTag[];
  perfPct: number;
  lastRun: string;
  description?: string;
}

export interface StrategyCardProps {
  strategy: StrategyCardData;
  onEdit?: (id: string) => void;
  onRun?: (id: string) => void;
}

const TAG_COLORS: Record<StrategyTag, string> = {
  kripto: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  bist: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hisse: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  scalping: 'bg-green-500/10 text-green-400 border-green-500/20',
  grid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  spot: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  swing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

/**
 * Strategy card for grid view
 * Displays strategy name, tags, performance, and actions
 */
export function StrategyCard({ strategy, onEdit, onRun }: StrategyCardProps) {
  return (
    <div
      className="bg-card rounded-lg border border-border p-4 hover:border-border-hover hover:bg-bg-card-hover transition-all"
      data-testid="strategy-card"
    >
      {/* Strategy Name */}
      <h3 className="text-lg font-semibold text-text-strong mb-3" title={strategy.description}>
        {strategy.name}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {strategy.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-1 rounded border ${TAG_COLORS[tag]}`}
            role="status"
            aria-label={`Tag: ${tag}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Performans</span>
          <span className={`text-sm font-semibold tabular ${getValueColorClass(strategy.perfPct)}`}>
            {formatPercent(strategy.perfPct, { decimals: 1 })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Son çalıştırma</span>
          <span className="text-sm text-text-base">{strategy.lastRun}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(strategy.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-card"
            data-testid={`btn-edit-${strategy.id}`}
            aria-label={`${strategy.name} stratejisini düzenle`}
          >
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Düzenle
            </span>
          </button>
        )}
        {onRun && (
          <button
            onClick={() => onRun(strategy.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success-hover rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-bg-card"
            data-testid={`btn-run-${strategy.id}`}
            aria-label={`${strategy.name} stratejisini çalıştır`}
          >
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Çalıştır
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

