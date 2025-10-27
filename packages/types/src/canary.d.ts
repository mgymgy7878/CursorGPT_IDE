export interface Thresholds {
    maxNotional: number;
    drawdownLimit: number;
    maxOrdersPerMin?: number;
}
export interface CanaryPlan {
    id: string;
    created_at: string;
    params?: Record<string, unknown>;
}
