export const dynamic = 'force-dynamic';

/**
 * Health check endpoint with SLO metrics
 * GET /api/healthz
 * 
 * Checks:
 * - UI service status
 * - Executor service connectivity
 * - SLO metrics (latency P95, staleness, error rate, uptime)
 */

// Global metrics tracking (in-memory, resets on restart)
const metrics = {
  requests: [] as number[], // response times in ms
  errors: 0,
  total: 0,
  startTime: Date.now(),
  lastCheck: Date.now(),
};

// Track request
function trackRequest(duration: number, isError: boolean) {
  metrics.total++;
  if (isError) metrics.errors++;
  
  metrics.requests.push(duration);
  
  // Keep only last 100 requests
  if (metrics.requests.length > 100) {
    metrics.requests.shift();
  }
  
  metrics.lastCheck = Date.now();
}

// Calculate P95 latency
function calculateP95(): number | null {
  if (metrics.requests.length === 0) return null;
  
  const sorted = [...metrics.requests].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index] || sorted[sorted.length - 1];
}

// Calculate error rate
function calculateErrorRate(): number {
  if (metrics.total === 0) return 0;
  return (metrics.errors / metrics.total) * 100;
}

// Calculate staleness (seconds since last successful check)
function calculateStaleness(): number {
  return Math.floor((Date.now() - metrics.lastCheck) / 1000);
}

// Calculate uptime (minutes since service start)
function calculateUptime(): number {
  return Math.floor((Date.now() - metrics.startTime) / 60000);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uiMode = url.searchParams.get('mode') === 'ui';
  const checkStart = Date.now();
  let isError = false;

  try {
    const executorUrl = process.env.NEXT_PUBLIC_EXECUTOR_URL || 'http://127.0.0.1:4001';
    
    // Check executor health
    let executorStatus = 'DOWN';
    let executorError: string | null = null;
    let executorLatency: number | null = null;
    
    try {
      const execStart = Date.now();
      const executorCheck = await fetch(`${executorUrl}/health`, {
        signal: AbortSignal.timeout(1200),
        headers: { 'Accept': 'application/json' }
      });
      
      executorLatency = Date.now() - execStart;
      executorStatus = executorCheck.ok ? 'UP' : 'DEGRADED';
      
      if (!executorCheck.ok) {
        isError = true;
      }
    } catch (err) {
      executorError = err instanceof Error ? err.message : 'Unknown error';
      isError = true;
    }

    const overallStatus = executorStatus === 'UP' ? 'UP' : 'DEGRADED';
    const requestDuration = Date.now() - checkStart;
    
    // Track this request
    trackRequest(requestDuration, isError);
    
    // Calculate SLO metrics
    // Check venue staleness
    const venues = {
      btcturk: { stalenessSec: 0, status: 'MOCK' },
      bist: { stalenessSec: 0, status: 'MOCK' },
    };

    // Try to get real venue staleness
    try {
      const { getBISTStaleness } = await import('@/lib/marketdata/bist');
      
      // BTCTurk staleness (from WS - mock for now)
      venues.btcturk.stalenessSec = 0;
      venues.btcturk.status = 'MOCK';
      
      // BIST staleness
      venues.bist.stalenessSec = getBISTStaleness();
      venues.bist.status = venues.bist.stalenessSec < 30 ? 'MOCK' : 'STALE';
    } catch {
      // Keep mock values
    }

    const sloMetrics = {
      latencyP95: calculateP95(),
      stalenessSec: calculateStaleness(),
      errorRate: calculateErrorRate(),
      uptimeMin: calculateUptime(),
    };

    const body = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        ui: 'UP',
        executor: {
          status: executorStatus,
          url: executorUrl,
          latency: executorLatency,
          error: executorError
        }
      },
      venues,
      slo: sloMetrics,
        thresholds: {
          latencyP95Target: 120, // ms (tightened from 150)
          stalenessTarget: 20,   // seconds (tightened from 30)
          errorRateTarget: 1.0,  // percent (tightened from 5.0)
          venueStalenessTarget: 20, // seconds (tightened from 30)
        }
    } as const;

    // UI mode: her durumda 200 döndür (ops health 503 davranışı korunur)
    const httpStatus = uiMode ? 200 : (overallStatus === 'UP' ? 200 : 503);
    return Response.json(body, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (err) {
    isError = true;
    const requestDuration = Date.now() - checkStart;
    trackRequest(requestDuration, isError);

    const body = {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
      slo: {
        latencyP95: calculateP95(),
        stalenessSec: calculateStaleness(),
        errorRate: calculateErrorRate(),
        uptimeMin: calculateUptime(),
      }
    };

    const httpStatus = uiMode ? 200 : 503;
    return Response.json(body, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }
}
