import { snapshotToPromText } from "@/server/metricsExport";

describe("metrics.prom exporter", () => {
  it("renders counters/gauges and timestamp", () => {
    const text = snapshotToPromText({
      counters: { spark_ws_trades_msgs: 3 },
      gauges: { spark_ws_staleness_seconds: 1.2 },
      ts: 123,
    });
    expect(text).toContain("spark_ws_trades_msgs_total 3");
    expect(text).toContain("spark_ws_staleness_seconds 1.2");
    expect(text).toContain("spark_metrics_ts_ms 123");
  });
});


