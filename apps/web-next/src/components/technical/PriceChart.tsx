"use client";
// Temporary disabled due to TypeScript build errors in CI
export interface PriceChartProps {
  candles: Array<{ t: number; c: number }>;
  fibLevels?: Array<{ ratio: number; price: number }>;
  bbSeries?: Array<{ u: number; m: number; l: number }>;
}

export default function PriceChart({ candles }: PriceChartProps) {
  return (
    <div className="h-[420px] w-full flex items-center justify-center border border-border rounded">
      <p className="text-text-muted">Price chart temporarily disabled</p>
    </div>
  );
}

