#!/usr/bin/env node
/* Simple Prometheus exposition snapshot → CSV + JSON summary
   Usage:
     node scripts/metrics/prom-snapshot.mjs --url http://127.0.0.1:3003/api/public/metrics --out docs/evidence/dev/v2.2-ui
   Defaults:
     url = http://127.0.0.1:3003/api/public/metrics
     out = docs/evidence/dev/v2.2-ui
*/
import fs from "fs";
import path from "path";
import os from "os";

const args = process.argv.slice(2);
const getArg = (k, def) => {
  const i = args.findIndex(a => a === k || a.startsWith(k + "="));
  if (i === -1) return def;
  const v = args[i].includes("=") ? args[i].split("=")[1] : args[i + 1];
  return v ?? def;
};
const url = getArg("--url", "http://127.0.0.1:3003/api/public/metrics");
const outDir = getArg("--out", "docs/evidence/dev/v2.2-ui");

const metricsOfInterest = [
  "futures_orders_blocked_total",
  "futures_uds_lifecycle_total",
  "futures_uds_last_keepalive_ts",
  "spark_http_request_duration_seconds_bucket"
];

const now = new Date();
const ts = now.toISOString();
const stamp = ts.replace(/[-:T]/g, "").slice(0, 15); // YYYYMMDDHHMMSS
const csvPath = path.join(outDir, `metrics_snapshot_${stamp}.csv`);
const summaryPath = path.join(outDir, `summary.json`);

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const text = await res.text();

  const lines = text.split(/\r?\n/);
  const csvRows = [["timestamp_iso", "metric", "labels", "value"]];
  const summary = {
    timestamp: ts,
    host: os.hostname(),
    metrics: {}
  };

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    // match: metric{labelK="labelV",...} 123.45
    const m = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
    if (!m) continue;
    const metric = m[1];
    if (!metricsOfInterest.some(x => metric.startsWith(x))) continue;

    const labelsRaw = m[2] || "";
    const value = Number(m[3]);

    // parse labels into object (best effort)
    const labels = {};
    if (labelsRaw) {
      const inner = labelsRaw.slice(1, -1);
      inner.split(",").forEach(kv => {
        const [k, v] = kv.split("=");
        if (k && v) labels[k.trim()] = v.trim().replace(/^"|"$/g, "");
      });
    }

    csvRows.push([ts, metric, Object.keys(labels).length ? JSON.stringify(labels) : "{}", String(value)]);

    // summary: aggregate by metric + label subsets we care about
    const key = metric;
    summary.metrics[key] = summary.metrics[key] || {};
    const labelKey = Object.keys(labels).length ? JSON.stringify(labels) : "_";
    summary.metrics[key][labelKey] = value;
  }

  fs.writeFileSync(csvPath, csvRows.map(r => r.join(",")).join("\n"), "utf8");
  // merge into existing summary if present
  try {
    const prev = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    prev.history = prev.history || [];
    prev.history.push(summary);
    while (prev.history.length > 30) prev.history.shift();
    fs.writeFileSync(summaryPath, JSON.stringify(prev, null, 2), "utf8");
  } catch {
    fs.writeFileSync(summaryPath, JSON.stringify({ history: [summary] }, null, 2), "utf8");
  }

  console.log(`[OK] Wrote ${csvPath} and updated ${summaryPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});


