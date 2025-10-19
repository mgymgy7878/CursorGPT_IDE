/**
 * Executor runtime status management
 * Single source of truth for "is executor online?"
 */

type ExecutorStatus = {
  online: boolean;
  ts: number;
};

let cached: ExecutorStatus | null = null;

const CACHE_TTL_MS = 15_000; // 15 seconds
const HEALTH_ENDPOINT = "/api/guardrails/read"; // Lightweight health check

/**
 * Check if executor is online
 * - Caches result for 15s to avoid hammering
 * - Graceful fallback: offline on error
 * - Never throws
 */
export async function isExecutorOnline(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if still fresh
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.online;
  }
  
  try {
    const r = await fetch(HEALTH_ENDPOINT, { 
      cache: "no-store" as any,
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    
    const online = r.ok;
    cached = { online, ts: now };
    
    return online;
  } catch {
    // Network error or timeout → offline
    cached = { online: false, ts: now };
    return false;
  }
}

/**
 * Force refresh executor status (bypass cache)
 */
export async function refreshExecutorStatus(): Promise<boolean> {
  cached = null;
  return isExecutorOnline();
}

/**
 * Get cached executor status without network call
 * Returns null if no cache available
 */
export function getCachedExecutorStatus(): boolean | null {
  if (!cached) return null;
  
  const now = Date.now();
  const isStale = now - cached.ts > CACHE_TTL_MS;
  
  return isStale ? null : cached.online;
}

/**
 * Subscribe to executor status changes
 * Polls every 30s and calls callback on change
 */
export function watchExecutorStatus(
  callback: (online: boolean) => void,
  intervalMs: number = 30_000
): () => void {
  let lastStatus: boolean | null = null;
  
  const check = async () => {
    const online = await isExecutorOnline();
    if (online !== lastStatus) {
      lastStatus = online;
      callback(online);
    }
  };
  
  // Initial check
  check();
  
  // Periodic check
  const interval = setInterval(check, intervalMs);
  
  // Cleanup function
  return () => clearInterval(interval);
}

