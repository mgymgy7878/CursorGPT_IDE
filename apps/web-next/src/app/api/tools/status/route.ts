/**
 * CI Health Gate
 * GET /api/tools/status
 * 
 * Checks health status and SLO thresholds for CI/CD gates
 * Returns 200 if all checks pass, 503 if any fail
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch health data
    const healthResponse = await fetch("http://localhost:3003/api/healthz", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!healthResponse.ok) {
      return Response.json(
        {
          status: "FAIL",
          reason: "Health check endpoint unreachable",
          checks: [],
        },
        { status: 503 }
      );
    }

    const health = await healthResponse.json();

    // Define checks
    const checks = [
      {
        name: "ui.up",
        pass: health.services.ui === "UP",
        value: health.services.ui,
        expected: "UP",
      },
      {
        name: "executor.up",
        pass: health.services.executor.status === "UP",
        value: health.services.executor.status,
        expected: "UP",
      },
      {
        name: "healthz.status",
        pass: health.status === "UP",
        value: health.status,
        expected: "UP",
      },
      {
        name: "healthz.slo.latencyP95",
        pass:
          health.slo.latencyP95 === null ||
          health.slo.latencyP95 < health.thresholds.latencyP95Target,
        value: health.slo.latencyP95,
        expected: `<${health.thresholds.latencyP95Target}ms`,
      },
      {
        name: "healthz.slo.errorRate",
        pass: health.slo.errorRate < health.thresholds.errorRateTarget,
        value: `${health.slo.errorRate}%`,
        expected: `<${health.thresholds.errorRateTarget}%`,
      },
      {
        name: "healthz.slo.staleness",
        pass: health.slo.stalenessSec < health.thresholds.stalenessTarget,
        value: `${health.slo.stalenessSec}s`,
        expected: `<${health.thresholds.stalenessTarget}s`,
      },
    ];

    const failedChecks = checks.filter((c) => !c.pass);
    const allPass = failedChecks.length === 0;

    return Response.json(
      {
        status: allPass ? "PASS" : "FAIL",
        passCount: checks.filter((c) => c.pass).length,
        totalChecks: checks.length,
        checks,
        failedChecks: failedChecks.map((c) => c.name),
        timestamp: new Date().toISOString(),
      },
      {
        status: allPass ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        status: "ERROR",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

