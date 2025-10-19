/**
 * Canary Dry-Run API
 * POST /api/tools/canary
 * 
 * Body: { mode: "mock" | "real", autoOk: boolean }
 */

export const dynamic = 'force-dynamic';

interface CanaryRequest {
  mode: "mock" | "real";
  autoOk?: boolean;
}

interface TestResult {
  endpoint: string;
  status: number;
  duration: number;
  pass: boolean;
}

export async function POST(request: Request) {
  try {
    const body: CanaryRequest = await request.json();
    const { mode = "mock", autoOk = false } = body;

    const baseUrl = 
      typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';

    // Test endpoints
    const endpoints = [
      { path: "/", name: "Root" },
      { path: "/dashboard", name: "Dashboard" },
      { path: "/portfolio", name: "Portfolio" },
      { path: "/strategies", name: "Strategies" },
      { path: "/settings", name: "Settings" },
      { path: "/api/healthz", name: "Health" },
    ];

    const results: TestResult[] = [];

    // Execute tests
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        const duration = Date.now() - start;

        results.push({
          endpoint: endpoint.name,
          status: response.status,
          duration,
          pass: response.ok,
        });
      } catch (err) {
        results.push({
          endpoint: endpoint.name,
          status: 0,
          duration: 0,
          pass: false,
        });
      }
    }

    // Get SLO metrics
    let sloStatus = "UNKNOWN";
    let sloMetrics = null;

    try {
      const healthResponse = await fetch(`${baseUrl}/api/healthz`);
      const health = await healthResponse.json();

      sloMetrics = health.slo;
      const thresholds = health.thresholds;

      // Check SLO thresholds
      const sloIssues = [];

      if (
        sloMetrics.latencyP95 !== null &&
        sloMetrics.latencyP95 > thresholds.latencyP95Target
      ) {
        sloIssues.push("latency");
      }

      if (sloMetrics.errorRate > thresholds.errorRateTarget) {
        sloIssues.push("errors");
      }

      if (sloMetrics.stalenessSec > thresholds.stalenessTarget) {
        sloIssues.push("staleness");
      }

      sloStatus = sloIssues.length === 0 ? "OK" : "WARNING";
    } catch (err) {
      sloStatus = "ERROR";
    }

    // Calculate summary
    const pass = results.filter((r) => r.pass).length;
    const total = results.length;
    const passRate = Math.round((pass / total) * 100);

    const decision = autoOk
      ? pass === total && sloStatus === "OK"
        ? "APPROVED"
        : "BLOCKED"
      : "MANUAL";

    return Response.json(
      {
        mode,
        autoOk,
        decision,
        pass,
        total,
        passRate,
        sloStatus,
        sloMetrics,
        results,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

