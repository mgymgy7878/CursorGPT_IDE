// Minimal canary-facing types to satisfy imports; refine with real spec later
export interface Thresholds {
  maxNotional: number;
  drawdownLimit: number;         // [0,100]
  maxOrdersPerMin?: number;      // >=0
}

export interface CanaryPlan {
  id: string;
  created_at: string;            // ISO
  params?: Record<string, unknown>;
} 
