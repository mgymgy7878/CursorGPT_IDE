// apps/web-next/src/types/metrics.ts
export interface MetricsSummary {
  p95_ms: number;
  error_rate: number;       // %
  psi: number;
  match_rate: number;       // %
  total_predictions: number;
}

export interface ServiceHealth {
  [name: string]: {
    name: string;
    ok: boolean;
    data?: any;
    error?: string;
  };
}
