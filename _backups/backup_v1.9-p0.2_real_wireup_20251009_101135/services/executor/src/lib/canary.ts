import { normalizeCanaryResponse, type CanaryRunResponse, type CanaryRunResponseInput } from "@spark/types";

export function parseCanary(raw: unknown): CanaryRunResponse {
  return normalizeCanaryResponse((raw ?? {}) as CanaryRunResponseInput);
} 