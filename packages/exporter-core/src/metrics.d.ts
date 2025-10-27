import { register, Counter, Histogram, Gauge } from 'prom-client';
export declare const exportRequestsTotal: Counter<"status" | "format" | "user">;
export declare const exportLatencyMsBucket: Histogram<"format" | "size">;
export declare const exportBytesTotal: Counter<"status" | "format">;
export declare const exportConcurrentRunning: Gauge<string>;
export declare const exportFailTotal: Counter<"format" | "reason">;
export declare const exportQueueDepth: Gauge<string>;
export declare const exportMemoryBytes: Gauge<"format">;
export declare const exportThroughputOpsPerSec: Gauge<"format">;
export declare const exportSuccessRate: Gauge<"format">;
export { register };
//# sourceMappingURL=metrics.d.ts.map