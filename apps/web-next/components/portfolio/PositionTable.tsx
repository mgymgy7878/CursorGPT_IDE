'use client';

import React, { useRef } from 'react';
import { formatCurrency, formatPercent, getValueColorClass } from '@/lib/utils/currency';
import { useFlashHighlight } from '@/lib/utils/flash-highlight';

export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  pnlUSD: number;
  pnlPct: number;
  side?: 'long' | 'short';
}

export interface PositionTableProps {
  positions: Position[];
  onClosePosition?: (symbol: string) => void;
  onReversePosition?: (symbol: string) => void;
  isLoading?: boolean;
}

function PositionRow({
  position,
  onClosePosition,
  onReversePosition,
}: {
  position: Position;
  onClosePosition?: (symbol: string) => void;
  onReversePosition?: (symbol: string) => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  // Flash highlight when PnL changes
  useFlashHighlight(rowRef, position.pnlUSD, {
    color: position.pnlUSD >= 0 ? 'success' : 'danger',
    duration: 1000,
    enabled: true,
  });

  return (
    <tr
      ref={rowRef}
      className="hover:bg-bg-card-hover transition-colors"
      data-testid={`position-${position.symbol}`}
    >
      {/* Symbol */}
      <td className="px-4 py-3 text-sm font-medium text-text-strong">
        <div className="flex items-center gap-2">
          {position.symbol}
          {position.side && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                position.side === 'long'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}
            >
              {position.side.toUpperCase()}
            </span>
          )}
        </div>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3 text-right text-sm text-text-base tabular">
        {position.qty.toFixed(4)}
      </td>

      {/* Price (USD) */}
      <td className="px-4 py-3 text-right text-sm text-text-base tabular">
        {formatCurrency(position.currentPrice, { decimals: 2 })}
      </td>

      {/* PnL (USD) */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold tabular ${getValueColorClass(position.pnlUSD)}`}>
          {formatCurrency(position.pnlUSD, { showPositiveSign: true, decimals: 2 })}
        </span>
      </td>

      {/* PnL % */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold tabular ${getValueColorClass(position.pnlPct)}`}>
          {formatPercent(position.pnlPct, { decimals: 2 })}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {onClosePosition && (
            <button
              onClick={() => onClosePosition(position.symbol)}
              className="px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded hover:bg-danger/20 transition-colors"
              data-testid={`btn-close-${position.symbol}`}
            >
              Pozisyonu Kapat
            </button>
          )}
          {onReversePosition && (
            <button
              onClick={() => onReversePosition(position.symbol)}
              className="px-3 py-1.5 text-xs font-medium text-text-base bg-bg-card-hover border border-border rounded hover:bg-bg-card transition-colors"
              data-testid={`btn-reverse-${position.symbol}`}
            >
              Ters Pozisyon Aç
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Open positions table for portfolio page
 * Supports real-time updates with flash highlights
 */
export function PositionTable({
  positions,
  onClosePosition,
  onReversePosition,
  isLoading = false,
}: PositionTableProps) {
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

  if (positions.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-text-muted">Açık pozisyon bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden" data-testid="positions-table">
      <table className="w-full">
        <thead className="bg-bg-card-hover border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Varlık
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Miktar
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Fiyat (USD)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              PnL (USD)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              PnL %
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Aksiyon
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {positions.map((position) => (
            <PositionRow
              key={position.symbol}
              position={position}
              onClosePosition={onClosePosition}
              onReversePosition={onReversePosition}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

