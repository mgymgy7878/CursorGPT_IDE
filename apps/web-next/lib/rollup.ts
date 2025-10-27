// import { getPrisma } from "@spark/db";
import { metrics } from "./metrics";

export async function runMetricsRollup(): Promise<{ inserted: number; events: number }> {
  // const prisma = getPrisma();
  const prisma = null as any; // Mock for now
  let inserted = 0;
  let events = 0;

  try {
    // Executor'dan snapshot al
    const executorUrl = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
    const response = await fetch(`${executorUrl}/api/public/metrics/snapshot`, {
      method: "GET",
      headers: { "content-type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Executor snapshot failed: ${response.status}`);
    }

    const snapshot = await response.json();

    // MetricsSample kayıtları oluştur
    const samples: any[] = [];

    // Executor metrikleri
    if (typeof snapshot.live_trades_total === 'number') {
      samples.push({
        source: "executor",
        name: "live_trades_total",
        value: snapshot.live_trades_total,
        labels: null
      });
    }

    if (snapshot.live_blocked_total) {
      Object.entries(snapshot.live_blocked_total).forEach(([key, value]) => {
        if (typeof value === 'number') {
          samples.push({
            source: "executor",
            name: `live_blocked_total.${key}`,
            value: value as number,
            labels: { reason: key }
          });
        }
      });
    }

    // Web metrikleri (mock for now)
    const webMetrics = {
      rbac_blocked_total: 0,
      backtest_runs_total: 0,
      optimize_runs_total: 0,
      audit_ui_queries_total: 0,
      metrics_rollup_jobs_total: 0,
      metrics_rollup_events_total: 0
    };

    Object.entries(webMetrics).forEach(([name, value]) => {
      samples.push({
        source: "web",
        name,
        value,
        labels: null
      });
    });

    // DB'ye yaz (mock for now - no actual DB operations)
    if (samples.length > 0) {
      // await prisma.metricsSample.createMany({
      //   data: samples
      // });
      inserted = samples.length;
    }

    // Threshold kontrolü (mock for now)
    const thresholds: any[] = []; // Mock empty thresholds
    // const thresholds = await prisma.metricsThreshold.findMany({
    //   where: { enabled: true }
    // });

    for (const threshold of thresholds) {
      const sample = samples.find(s => s.name === threshold.name);
      if (!sample) continue;

      let matched = false;
      switch (threshold.op) {
        case "gt":
          matched = (sample as any).value > threshold.value;
          break;
        case "gte":
          matched = (sample as any).value >= threshold.value;
          break;
        case "lt":
          matched = (sample as any).value < threshold.value;
          break;
        case "lte":
          matched = (sample as any).value <= threshold.value;
          break;
        case "eq":
          matched = (sample as any).value === threshold.value;
          break;
      }

      if (matched) {
        // await prisma.metricsEvent.create({
        //   data: {
        //     name: threshold.name,
        //     value: (sample as any).value,
        //     matched: true,
        //     severity: threshold.severity,
        //     details: {
        //       threshold: threshold.value,
        //       operator: threshold.op,
        //       source: (sample as any).source,
        //       labels: (sample as any).labels
        //     }
        //   }
        // });
        events++;
      }
    }

    metrics.incMetricsRollupJobs();
    if (events > 0) {
      metrics.incMetricsRollupEvents();
    }

    return { inserted, events };
  } catch (error) {
    console.error("Metrics rollup error:", error);
    throw error;
  }
}

// Timer-based rollup (dev only)
if (typeof globalThis !== 'undefined' && !globalThis.__metrics_timer__) {
  globalThis.__metrics_timer__ = setInterval(async () => {
    try {
      await runMetricsRollup();
    } catch (error) {
      console.error("Timer-based rollup failed:", error);
    }
  }, 60000); // 60 seconds
} 