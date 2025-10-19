/**
 * Prometheus Metrics Export
 * GET /api/tools/metrics?format=prometheus
 * 
 * Exports SLO metrics in Prometheus text format
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    // Fetch health data
    const healthResponse = await fetch("http://localhost:3003/api/healthz", {
      cache: "no-store",
    });

    if (!healthResponse.ok) {
      throw new Error("Health check failed");
    }

    const health = await healthResponse.json();

    if (format === "prometheus") {
      // Prometheus text format
      const metrics: string[] = [];

      // Help and type declarations
      metrics.push("# HELP ui_latency_p95_ms P95 latency in milliseconds");
      metrics.push("# TYPE ui_latency_p95_ms gauge");
      metrics.push(
        `ui_latency_p95_ms ${health.slo.latencyP95 !== null ? health.slo.latencyP95 : 0}`
      );
      metrics.push("");

      metrics.push("# HELP ui_error_rate_pct Error rate percentage");
      metrics.push("# TYPE ui_error_rate_pct gauge");
      metrics.push(`ui_error_rate_pct ${health.slo.errorRate}`);
      metrics.push("");

      metrics.push("# HELP ui_staleness_sec Staleness in seconds");
      metrics.push("# TYPE ui_staleness_sec gauge");
      metrics.push(`ui_staleness_sec ${health.slo.stalenessSec}`);
      metrics.push("");

      metrics.push("# HELP ui_uptime_min Uptime in minutes");
      metrics.push("# TYPE ui_uptime_min counter");
      metrics.push(`ui_uptime_min ${health.slo.uptimeMin}`);
      metrics.push("");

      // Executor status (1=UP, 0=DOWN)
      metrics.push("# HELP executor_status Executor status (1=UP, 0=DOWN)");
      metrics.push("# TYPE executor_status gauge");
      metrics.push(
        `executor_status ${health.services.executor.status === "UP" ? 1 : 0}`
      );
      metrics.push("");

      // Executor latency
      if (health.services.executor.latency !== null) {
        metrics.push("# HELP executor_latency_ms Executor latency in milliseconds");
        metrics.push("# TYPE executor_latency_ms gauge");
        metrics.push(`executor_latency_ms ${health.services.executor.latency}`);
        metrics.push("");
      }

    // Venue staleness
    if (health.venues) {
      metrics.push("# HELP venue_staleness_btcturk_sec BTCTurk data staleness in seconds");
      metrics.push("# TYPE venue_staleness_btcturk_sec gauge");
      metrics.push(`venue_staleness_btcturk_sec ${health.venues.btcturk.stalenessSec}`);
      metrics.push("");

      metrics.push("# HELP venue_staleness_bist_sec BIST data staleness in seconds");
      metrics.push("# TYPE venue_staleness_bist_sec gauge");
      metrics.push(`venue_staleness_bist_sec ${health.venues.bist.stalenessSec}`);
      metrics.push("");
    }

    // Rate limiting metrics
    const { getPrometheusMetrics } = await import('@/lib/rate-limiter');
    const rateLimitMetrics = getPrometheusMetrics();
    metrics.push(...rateLimitMetrics);

    // WebSocket metrics (mock for now)
    metrics.push("# HELP ws_reconnects_total Total WebSocket reconnections");
    metrics.push("# TYPE ws_reconnects_total counter");
    metrics.push("ws_reconnects_total 0");
    metrics.push("");

    metrics.push("# HELP ws_messages_total Total WebSocket messages received");
    metrics.push("# TYPE ws_messages_total counter");
    metrics.push("ws_messages_total 0");
    metrics.push("");

    metrics.push("# HELP venue_timeout_total Total venue timeouts");
    metrics.push("# TYPE venue_timeout_total counter");
    metrics.push("venue_timeout_total 0");
    metrics.push("");

      return new Response(metrics.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; version=0.0.4",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } else {
      // JSON format
      return Response.json(
        {
          metrics: {
            ui_latency_p95_ms: health.slo.latencyP95,
            ui_error_rate_pct: health.slo.errorRate,
            ui_staleness_sec: health.slo.stalenessSec,
            ui_uptime_min: health.slo.uptimeMin,
            executor_status: health.services.executor.status === "UP" ? 1 : 0,
            executor_latency_ms: health.services.executor.latency,
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

