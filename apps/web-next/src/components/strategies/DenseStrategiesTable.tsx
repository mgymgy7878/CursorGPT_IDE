/**
 * DenseStrategiesTable - Dense table for strategies
 *
 * Figma parity: TradingView/terminal density
 * Row height: 40-44px, Header: 44-48px
 * Numbers: MonoNumber, PnL/delta: DeltaText, Status: Badge, Actions: RowActions
 */

'use client';

import { DataTable, DataTableHeader, DataTableRow, DataTableCell, DataTableHeaderCell } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { DeltaText } from '@/components/ui/DeltaText';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { RowActions, RowActionButton } from '@/components/ui/RowActions';
import { RowOverflowMenu } from '@/components/ui/RowOverflowMenu';
import { formatCurrency, formatPercent } from '@/lib/format';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { EmptyState } from '@/components/ui/states';
import { uiCopy } from '@/lib/uiCopy';
import { cn } from '@/lib/utils';

export interface StrategyRow {
  id: string;
  strategy: string;
  market: string;
  category?: string;
  leverage?: number;
  pnl24h?: number;
  pnl7d?: number;
  winRate30d?: number;
  sharpe30d?: number;
  risk?: string;
  status: 'active' | 'running' | 'paused' | 'inactive' | 'stuck';
  // Running-specific
  mode?: 'shadow' | 'live';
  openPositions?: number;
  exposure?: number;
  health?: 'ok' | 'degraded' | 'error';
}

export interface DenseStrategiesTableProps {
  columns: string[];
  data: StrategyRow[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: 'start' | 'stop' | 'pause') => void;
  executorHealthy?: boolean; // Disable actions if executor is down
  variant?: 'my-strategies' | 'running-strategies';
}

export default function DenseStrategiesTable({
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  executorHealthy = true,
  variant = 'my-strategies',
}: DenseStrategiesTableProps) {
  if (loading) {
    return <SkeletonBlock variant="table" />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No strategies found"
        description="Create your first strategy to get started"
      />
    );
  }

  // PATCH W.5: Status badge'leri uiCopy'den
  const getStatusBadge = (status: StrategyRow['status']) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Badge variant="success">{uiCopy.status.active}</Badge>;
      case 'paused':
        return <Badge variant="warning">{uiCopy.status.paused}</Badge>;
      case 'stuck':
        return <Badge variant="destructive">{uiCopy.status.stuck}</Badge>;
      default:
        return <Badge variant="secondary">{uiCopy.status.inactive}</Badge>;
    }
  };

  // PATCH W.5: Health badge'leri uiCopy'den
  const getHealthBadge = (health?: StrategyRow['health']) => {
    if (!health) return null;
    switch (health) {
      case 'ok':
        return <Badge variant="success">{uiCopy.health.ok}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{uiCopy.health.degraded}</Badge>;
      case 'error':
        return <Badge variant="destructive">{uiCopy.health.error}</Badge>;
      default:
        return null;
    }
  };

  // PATCH SCROLL-AUDIT: Nested scroll kaldırıldı - sayfa scroll'una güveniliyor
  return (
    <div
      className="w-full rounded-lg border border-neutral-800 min-h-0"
    >
      <DataTable>
        <DataTableHeader>
          <DataTableRow hover={false} className="h-12">
            {columns.map((col) => {
              // PATCH W.4: Actions kolonu - lg ve üzeri ekranlarda görünür
              const isActions = col === uiCopy.table.actions;
              return (
                <DataTableHeaderCell
                  key={col}
                  className={cn("text-xs font-medium", isActions && "hidden lg:table-cell")}
                >
                  {col}
                </DataTableHeaderCell>
              );
            })}
          </DataTableRow>
        </DataTableHeader>
        <tbody>
          {data.map((row) => (
            <DataTableRow key={row.id} className="h-11">
              <DataTableCell>
                <span className="font-semibold text-neutral-200 text-sm">{row.strategy}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="text-neutral-300 text-sm">{row.market}</span>
              </DataTableCell>
              {variant === 'my-strategies' && (
                <>
                  {row.category && (
                    <DataTableCell>
                      <span className="text-neutral-400 text-xs">{row.category}</span>
                    </DataTableCell>
                  )}
                  {row.leverage !== undefined && (
                    <DataTableCell>
                      <MonoNumber value={`${row.leverage}x`} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.pnl24h !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <DeltaText value={row.pnl24h} />
                    </DataTableCell>
                  )}
                  {row.pnl7d !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <DeltaText value={row.pnl7d} />
                    </DataTableCell>
                  )}
                  {row.winRate30d !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      {/* PATCH W.2.1: WinRate normalizasyonu - 0-1 ratio ise auto ×100, 0-100 ise olduğu gibi */}
                      <MonoNumber value={formatPercent(row.winRate30d, { auto: true, minimumFractionDigits: 2, maximumFractionDigits: 2 })} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.sharpe30d !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <MonoNumber value={row.sharpe30d.toFixed(2)} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.risk && (
                    <DataTableCell>
                      {/* PATCH Q: Risk seviyeleri Türkçeleştirme */}
                      <Badge variant="info">
                        {row.risk === 'Low' ? uiCopy.risk.low : row.risk === 'Medium' ? uiCopy.risk.medium : row.risk === 'High' ? uiCopy.risk.high : row.risk}
                      </Badge>
                    </DataTableCell>
                  )}
                </>
              )}
              {variant === 'running-strategies' && (
                <>
                  {row.mode && (
                    <DataTableCell>
                      {/* PATCH W.5: Mode badge'leri uiCopy'den */}
                      <Badge variant={row.mode === 'live' ? 'success' : 'secondary'}>
                        {row.mode === 'live' ? uiCopy.mode.live : uiCopy.mode.shadow}
                      </Badge>
                    </DataTableCell>
                  )}
                  {row.openPositions !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <MonoNumber value={row.openPositions} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.exposure !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <MonoNumber value={formatCurrency(row.exposure)} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.pnl24h !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <DeltaText value={row.pnl24h} />
                    </DataTableCell>
                  )}
                  {row.pnl7d !== undefined && (
                    <DataTableCell className="text-right tabular-nums">
                      <DeltaText value={row.pnl7d} />
                    </DataTableCell>
                  )}
                  {row.risk && (
                    <DataTableCell>
                      {/* PATCH Q: Risk seviyeleri Türkçeleştirme */}
                      <Badge variant="info">
                        {row.risk === 'Low' ? uiCopy.risk.low : row.risk === 'Medium' ? uiCopy.risk.medium : row.risk === 'High' ? uiCopy.risk.high : row.risk}
                      </Badge>
                    </DataTableCell>
                  )}
                  {row.health && (
                    <DataTableCell>
                      {getHealthBadge(row.health)}
                    </DataTableCell>
                  )}
                </>
              )}
              <DataTableCell>
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(row.status)}
                  {/* PATCH W.4: Overflow menu - lg'den küçük ekranlarda Actions yerine */}
                  <div className="lg:hidden" onClick={(e) => e.stopPropagation()}>
                    <RowOverflowMenu>
                      {onStatusChange && row.status === 'active' && (
                        <RowActionButton
                          icon="⏸"
                          label={executorHealthy ? uiCopy.tooltip.pause : 'Executor kullanılamıyor'}
                          onClick={() => executorHealthy && onStatusChange(row.id, 'pause')}
                          disabled={!executorHealthy}
                        />
                      )}
                      {onStatusChange && row.status === 'paused' && (
                        <RowActionButton
                          icon="▶"
                          label={executorHealthy ? uiCopy.tooltip.resume : 'Executor kullanılamıyor'}
                          onClick={() => executorHealthy && onStatusChange(row.id, 'start')}
                          disabled={!executorHealthy}
                        />
                      )}
                      {onEdit && (
                        <RowActionButton icon="✏️" label={uiCopy.tooltip.edit} onClick={() => onEdit(row.id)} />
                      )}
                      {onDelete && (
                        <RowActionButton icon="🗑️" label={uiCopy.tooltip.delete} variant="danger" onClick={() => onDelete(row.id)} />
                      )}
                    </RowOverflowMenu>
                  </div>
                </div>
              </DataTableCell>
              {/* PATCH W.4: Actions kolonu - lg ve üzeri ekranlarda görünür */}
              <DataTableCell className="hidden lg:table-cell text-right">
                <RowActions>
                  {onStatusChange && row.status === 'active' && (
                    <RowActionButton
                      icon="⏸"
                      label={executorHealthy ? uiCopy.tooltip.pause : 'Executor kullanılamıyor'}
                      onClick={() => executorHealthy && onStatusChange(row.id, 'pause')}
                      disabled={!executorHealthy}
                    />
                  )}
                  {onStatusChange && row.status === 'paused' && (
                    <RowActionButton
                      icon="▶"
                      label={executorHealthy ? uiCopy.tooltip.resume : 'Executor kullanılamıyor'}
                      onClick={() => executorHealthy && onStatusChange(row.id, 'start')}
                      disabled={!executorHealthy}
                    />
                  )}
                  {onEdit && (
                    <RowActionButton icon="✏️" label={uiCopy.tooltip.edit} onClick={() => onEdit(row.id)} />
                  )}
                  {onDelete && (
                    <RowActionButton icon="🗑️" label={uiCopy.tooltip.delete} variant="danger" onClick={() => onDelete(row.id)} />
                  )}
                </RowActions>
              </DataTableCell>
            </DataTableRow>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

