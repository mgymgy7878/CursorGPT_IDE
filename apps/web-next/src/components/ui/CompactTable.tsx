/**
 * CompactTable - Dense table for dashboard
 *
 * Figma parity: Active Strategies 3-row table
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Surface } from './Surface';

export interface CompactTableColumn {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => ReactNode;
}

export interface CompactTableProps {
  title: string;
  badge?: string;
  columns: CompactTableColumn[];
  data: any[];
  className?: string;
}

export function CompactTable({ title, badge, columns, data, className }: CompactTableProps) {
  return (
    <Surface variant="card" className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        {/* Figma parity: text-[13px] font-medium leading-none */}
        <div className="text-[13px] font-medium text-neutral-200 leading-none">{title}</div>
        {/* Figma parity: Badge standardı - h-6, px-2, text-[11px] */}
        {badge && (
          <span className="h-6 px-2 flex items-center text-[11px] font-medium rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 leading-none">
            {badge}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              {columns.map((col) => (
                <th key={col.accessor} className="text-left py-2 px-2 text-[11px] text-neutral-400 font-medium leading-none">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-white/8/30 last:border-0 hover:bg-neutral-900/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.accessor} className="py-2 px-2">
                    {col.render ? col.render(row[col.accessor], row) : (
                      <span className="text-[13px] text-neutral-200 leading-none">{String(row[col.accessor] ?? '')}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

