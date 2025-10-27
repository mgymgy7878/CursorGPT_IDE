// Canary domain types — minimal, derlemeyi unblocks; ileride sıkılaştıracağız.
import type { CanaryThresholds } from "./thresholds.js";

export interface CanaryGates {
  risk: boolean;            // risk yüksek mi?
  gateOpen: boolean;        // kapı açık mı? (true = trade serbest)
  reason?: string;          // kısa açıklama
  thresholds: CanaryThresholds;
}

export interface CanaryRunResponse {
  id: string;
  startedAt: string;        // ISO
  durationMs: number;
  gates: CanaryGates;
  placed?: number;
  fills?: number;
  errors?: number;
}

export function normalizeCanaryResponse(input: any): CanaryRunResponse {
  const thr = input?.gates?.thresholds ?? {};
  return {
    id: String(input?.id ?? input?.runId ?? "unknown"),
    startedAt: new Date(input?.startedAt ?? Date.now()).toISOString(),
    durationMs: Number(input?.durationMs ?? input?.duration ?? 0),
    gates: {
      risk: Boolean(input?.gates?.risk ?? input?.risk ?? false),
      gateOpen: Boolean(input?.gates?.gateOpen ?? input?.gateOpen ?? true),
      reason: input?.gates?.reason ?? input?.reason,
      thresholds: {
        maxNotional: thr?.maxNotional ?? input?.maxNotional,
        maxDrawdownPct: thr?.maxDrawdownPct ?? input?.maxDrawdownPct,
        maxLatencyMs: thr?.maxLatencyMs ?? input?.maxLatencyMs
      }
    },
    placed: Number(input?.placed ?? 0),
    fills: Number(input?.fills ?? 0),
    errors: Number(input?.errors ?? 0)
  };
}
