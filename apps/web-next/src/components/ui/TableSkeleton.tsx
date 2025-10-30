"use client";

export interface TableSkeletonProps {
  /**
   * Number of skeleton rows to display
   * @default 8
   */
  rows?: number;
  /**
   * Optional table header labels
   */
  headers?: string[];
  /**
   * Show a count indicator (e.g., "Total: 0")
   */
  showCount?: boolean;
  countLabel?: string;
}

/**
 * TableSkeleton - Loading state for tables
 *
 * Features:
 * - Configurable row count
 * - Optional headers
 * - Pulse animation
 * - Result count indicator
 *
 * Usage:
 * ```tsx
 * <TableSkeleton
 *   rows={10}
 *   headers={["Symbol", "Price", "PnL"]}
 *   showCount
 *   countLabel="Total: 0"
 * />
 * ```
 */
export default function TableSkeleton({
  rows = 8,
  headers,
  showCount = false,
  countLabel = "Total: 0",
}: TableSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table data">
      {/* Optional headers */}
      {headers && headers.length > 0 && (
        <div className="grid gap-4 px-4 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wide border-b border-zinc-800" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
          {headers.map((header, idx) => (
            <div key={idx}>{header}</div>
          ))}
        </div>
      )}

      {/* Skeleton rows */}
      <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-zinc-900/40 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Optional count indicator */}
      {showCount && (
        <div className="text-sm text-neutral-400 px-1">
          {countLabel}
        </div>
      )}
    </div>
  );
}

