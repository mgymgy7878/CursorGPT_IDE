#!/usr/bin/env node
/**
 * scripts/canary-index.mjs
 * Aggregate evidence/canary/<NONCE> into INDEX.csv
 * Recomputes decision from plan.thresholds + latency.gates
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "evidence", "canary");
if (!fs.existsSync(root)) {
  console.error("No evidence/canary/ found.");
  process.exit(2);
}

const rows = [];
const header = [
  "nonce","ts","dryRun",
  "status","decision","reason",
  "ack_p95_ms","event_to_db_p95_ms","ingest_lag_p95_s","seq_gap_total","slippage_p95_bps","clock_drift_ms_p95",
  "observed_signals","plan_path","latency_path","metrics_path","audit_path"
];

for (const nonce of fs.readdirSync(root)) {
  const dir = path.join(root, nonce);
  const planPath = path.join(dir, "plan.json");
  const latencyPath = path.join(dir, "latency.json");
  const metricsPath = path.join(dir, "metrics.json");
  const auditPath = path.join(dir, "audit.log");
  try {
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    const latency = JSON.parse(fs.readFileSync(latencyPath, "utf8"));
    const metrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, "utf8")) : { raw:"empty", metrics:{} };

    const gates = latency.gates || {};
    const thr = plan.thresholds || {};

    const vals = [
      gates.ack_p95_ms, gates.event_to_db_p95_ms,
      gates.ingest_lag_p95_s, gates.seq_gap_total,
      gates.slippage_p95_bps, gates.clock_drift_ms_p95
    ];

    const hasUnknown = vals.some(v => v === "unknown" || typeof v === "undefined" || v === null);
    const within =
      !hasUnknown &&
      Number(gates.ack_p95_ms) < Number(thr.ack_p95_ms ?? 1000) &&
      Number(gates.event_to_db_p95_ms) < Number(thr.event_to_db_p95_ms ?? 300) &&
      Number(gates.ingest_lag_p95_s) <= Number(thr.ingest_lag_p95_s ?? 2) &&
      Number(gates.seq_gap_total) === Number(thr.seq_gap_total ?? 0);

    const decision = within ? "GO→Step1" : "HOLD";
    const status = hasUnknown ? "WARNING" : "ARMED";
    const reason = hasUnknown ? "unknown_metrics" : (within ? "ok" : "threshold_violation");
    const observedSignals = metrics.metrics ? Object.keys(metrics.metrics).length : 0;

    rows.push([
      nonce, plan.ts, String(plan.dryRun ?? true),
      status, decision, reason,
      gates.ack_p95_ms ?? "", gates.event_to_db_p95_ms ?? "", gates.ingest_lag_p95_s ?? "", gates.seq_gap_total ?? "",
      gates.slippage_p95_bps ?? "", gates.clock_drift_ms_p95 ?? "",
      observedSignals,
      planPath, latencyPath, metricsPath, auditPath
    ].map(v => (typeof v === "string" ? `"${v.replace(/"/g,'""')}"` : v)).join(","));
  } catch (e) {
    // skip malformed
  }
}

const out = [header.join(","), ...rows.sort()].join("\n");
const outPath = path.join(root, "INDEX.csv");
fs.writeFileSync(outPath, out, "utf8");
console.log("WROTE", outPath, "rows=", rows.length); 