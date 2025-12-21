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
import { formatCurrency, formatPercent } from '@/lib/format';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { EmptyState } from '@/components/ui/states';

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
  variant?: 'my-strategies' | 'running-strategies';
}

export default function DenseStrategiesTable({
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
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

  const getStatusBadge = (status: StrategyRow['status']) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Badge variant="success">Active</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'stuck':
        return <Badge variant="destructive">Stuck</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const getHealthBadge = (health?: StrategyRow['health']) => {
    if (!health) return null;
    switch (health) {
      case 'ok':
        return <Badge variant="success">OK</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-800">
      <DataTable>
        <DataTableHeader>
          <DataTableRow hover={false} className="h-12">
            {columns.map((col) => (
              <DataTableHeaderCell key={col} className="text-xs font-medium">
                {col}
              </DataTableHeaderCell>
            ))}
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
                    <DataTableCell className="text-right">
                      <DeltaText value={row.pnl24h} />
                    </DataTableCell>
                  )}
                  {row.pnl7d !== undefined && (
                    <DataTableCell className="text-right">
                      <DeltaText value={row.pnl7d} />
                    </DataTableCell>
                  )}
                  {row.winRate30d !== undefined && (
                    <DataTableCell className="text-right">
                      <MonoNumber value={formatPercent(row.winRate30d / 100)} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.sharpe30d !== undefined && (
                    <DataTableCell className="text-right">
                      <MonoNumber value={row.sharpe30d.toFixed(2)} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.risk && (
                    <DataTableCell>
                      <Badge variant="info">{row.risk}</Badge>
                    </DataTableCell>
                  )}
                </>
              )}
              {variant === 'running-strategies' && (
                <>
                  {row.mode && (
                    <DataTableCell>
                      <Badge variant={row.mode === 'live' ? 'success' : 'secondary'}>
                        {row.mode}
                      </Badge>
                    </DataTableCell>
                  )}
                  {row.openPositions !== undefined && (
                    <DataTableCell className="text-right">
                      <MonoNumber value={row.openPositions} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.exposure !== undefined && (
                    <DataTableCell className="text-right">
                      <MonoNumber value={formatCurrency(row.exposure)} className="text-sm text-neutral-300" />
                    </DataTableCell>
                  )}
                  {row.pnl24h !== undefined && (
                    <DataTableCell className="text-right">
                      <DeltaText value={row.pnl24h} />
                    </DataTableCell>
                  )}
                  {row.pnl7d !== undefined && (
                    <DataTableCell className="text-right">
                      <DeltaText value={row.pnl7d} />
                    </DataTableCell>
                  )}
                  {row.risk && (
                    <DataTableCell>
                      <Badge variant="info">{row.risk}</Badge>
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
                {getStatusBadge(row.status)}
              </DataTableCell>
              <DataTableCell className="text-right">
                <RowActions>
                  {onStatusChange && row.status === 'active' && (
                    <RowActionButton icon="⏸" label="Pause" onClick={() => onStatusChange(row.id, 'pause')} />
                  )}
                  {onStatusChange && row.status === 'paused' && (
                    <RowActionButton icon="▶" label="Resume" onClick={() => onStatusChange(row.id, 'start')} />
                  )}
                  {onEdit && (
                    <RowActionButton icon="✏️" label="Edit" onClick={() => onEdit(row.id)} />
                  )}
                  {onDelete && (
                    <RowActionButton icon="🗑️" label="Delete" variant="danger" onClick={() => onDelete(row.id)} />
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

