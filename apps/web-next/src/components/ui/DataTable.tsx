/**
 * DataTable - Figma Parity Design Primitive
 *
 * Wrapper handles overflow-x; prevents page-level horizontal scroll
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="min-w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function DataTableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn('text-left text-neutral-300 bg-neutral-900/50', className)}>
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
      'border-b border-neutral-800',
      hover && 'hover:bg-neutral-900/30 transition-colors',
        onClick && 'cursor-pointer',
      className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={cn('py-3 px-4', className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function DataTableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('py-3 px-4 font-medium', className)}>
      {children}
    </th>
  );
}

