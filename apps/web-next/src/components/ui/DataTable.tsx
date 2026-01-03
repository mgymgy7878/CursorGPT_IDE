/**
 * DataTable - Figma Parity Design Primitive
 *
 * Wrapper handles overflow-x; prevents page-level horizontal scroll
 */

import { ReactNode } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';

export interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className={cn('min-w-full text-sm', className?.includes('table-fixed') && 'table-fixed')}>
        {children}
      </table>
    </div>
  );
}

export function DataTableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn(
      'text-left text-neutral-300',
      // PATCH W.1: Sticky header z-index + opak background (blend önleme)
      'sticky top-0 z-20 backdrop-blur-sm',
      'bg-neutral-900/98 border-b border-white/10',
      // PATCH W.1: DPI/Windows ölçek desteği (subpixel rendering)
      'will-change-transform',
      className
    )}>
      {children}
    </thead>
  );
}

export function DataTableRow({
  children,
  className,
  hover = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'border-b border-white/5',
        // PATCH W: Zebra pattern (çok hafif) + hover
        'even:bg-white/[0.01]',
        hover && 'transition-colors hover:bg-white/5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({ children, className, colSpan, style }: { children: ReactNode; className?: string; colSpan?: number; style?: React.CSSProperties }) {
  return (
    <td
      className={cn('font-[12px]', className)}
      style={{
        paddingTop: 'var(--row-py, 6px)',
        paddingBottom: 'var(--row-py, 6px)',
        paddingLeft: 'var(--cell-px, 12px)',
        paddingRight: 'var(--cell-px, 12px)',
        minHeight: 'var(--row-h, 40px)',
        ...style,
      }}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

export function DataTableHeaderCell({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <th
      className={cn('font-medium text-[12px] leading-tight', className)}
      style={{
        paddingTop: 'var(--row-py, 6px)',
        paddingBottom: 'var(--row-py, 6px)',
        paddingLeft: 'var(--cell-px, 12px)',
        paddingRight: 'var(--cell-px, 12px)',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

