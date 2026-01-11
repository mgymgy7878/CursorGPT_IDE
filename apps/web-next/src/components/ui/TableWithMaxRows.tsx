/**
 * TableWithMaxRows - Terminal density table wrapper
 *
 * Shows max N rows, then "Tümünü gör" footer action
 * Prevents nested scroll, uses modal/drawer/route for full view
 */

'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface TableWithMaxRowsProps {
  children: ReactNode;
  maxRows?: number;
  totalRows?: number;
  onShowAll?: () => void;
  showAllLabel?: string;
  className?: string;
  footerClassName?: string;
}

export function TableWithMaxRows({
  children,
  maxRows = 8,
  totalRows,
  onShowAll,
  showAllLabel = 'Tümünü gör',
  className,
  footerClassName,
}: TableWithMaxRowsProps) {
  const hasMore = totalRows !== undefined && totalRows > maxRows;
  const displayRows = totalRows !== undefined ? Math.min(maxRows, totalRows) : maxRows;

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      {/* Table content - clipped to maxRows */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="relative"
          style={{
            maxHeight: `calc(${displayRows} * var(--table-row-h, 44px) + var(--table-head-h, 48px))`,
            overflow: 'hidden',
          }}
        >
          {children}
          {/* Fade overlay if hasMore */}
          {hasMore && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Footer action */}
      {hasMore && onShowAll && (
        <div
          className={cn(
            'shrink-0 border-t border-neutral-800 bg-neutral-950/50 px-4 py-2 flex items-center justify-center',
            footerClassName
          )}
        >
          <button
            onClick={onShowAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAllLabel} ({totalRows - maxRows} daha)
          </button>
        </div>
      )}
    </div>
  );
}

