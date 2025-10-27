export declare const optJobsTotal: any;
export declare const optLatencyMs: any;
export declare const optCandidatesTotal: any;
export declare const optWfoFilteredTotal: any;
export declare const optBestScore: any;
/**
 * Helper: Record optimization run
 */
export declare function recordOptRun(objective: string, combinations: number): void;
/**
 * Helper: Record optimization latency
 */
export declare function recordOptLatency(combinations: number, durationMs: number): void;
/**
 * Helper: Record WFO filtering
 */
export declare function recordWfoFiltered(count: number): void;
/**
 * Helper: Record best score
 */
export declare function recordBestScore(symbol: string, objective: string, score: number): void;
//# sourceMappingURL=optimizer-metrics.d.ts.map