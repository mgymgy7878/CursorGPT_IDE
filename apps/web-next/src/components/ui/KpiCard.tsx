"use client";

export type KpiStatus = "good" | "warn" | "bad" | "idle";

export interface KpiCardProps {
  label: string;
  value: string | number;
  /**
   * Optional hint/target text (e.g., "Target: 1200 ms")
   */
  hint?: string;
  /**
   * Status determines the color tone:
   * - good: green
   * - warn: yellow
   * - bad: red
   * - idle: neutral (default)
   */
  status?: KpiStatus;
  className?: string;
}

/**
 * KpiCard - Threshold-aware metric display
 *
 * Features:
 * - Auto color coding based on status
 * - Consistent sizing and spacing
 * - Optional hint/target display
 *
 * Usage:
 * ```tsx
 * <KpiCard
 *   label="P95 Latency"
 *   value="58 ms"
 *   hint="Target: 1200 ms"
 *   status="good"
 * />
 * ```
 */
export default function KpiCard({
  label,
  value,
  hint,
  status = "idle",
  className = "",
}: KpiCardProps) {
  const statusColors: Record<KpiStatus, string> = {
    good: "text-green-400",
    warn: "text-yellow-400",
    bad: "text-red-400",
    idle: "text-neutral-300",
  };

  const valueColor = statusColors[status];

  return (
    <div className={`rounded-2xl bg-card/60 p-4 ${className}`}>
      <div className="text-xs text-neutral-400 uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular ${valueColor}`}>
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 text-xs text-neutral-400">{hint}</div>
      )}
    </div>
  );
}

