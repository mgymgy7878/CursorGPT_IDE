#!/usr/bin/env node
/**
 * Prometheus text endpoint'inden p95 kapıları okur, ihlalde exit 2 döner.
 * Kanıt: evidence/canary/alerts/<YYYYMMDDHHmm>.json
 */
import fs from "node:fs";
import path from "node:path";

const PULL = process.env.PROMETHEUS_PULL_URL || "http://127.0.0.1:3003/api/public/metrics/prom";
const THR = { ack_p95_ms:1000, event_to_db_p95_ms:300, ingest_lag_p95_s:2, seq_gap_total:0 };

const res = await fetch(PULL).catch(()=>null);
const text = res && res.ok ? await res.text() : "";
const lines = (text||"").split("\n").filter(l=>l && !l.startsWith("#"));

const metrics = {};
for (const l of lines) {
  const parts = l.trim().split(/\s+/);
  const name = parts[0];
  const val = Number(parts[parts.length-1]);
  if (!Number.isNaN(val)) metrics[name] = val;
}
function pick(...keys){ for (const k of keys) if (k in metrics) return metrics[k]; return undefined; }
const gates = {
  ack_p95_ms: pick("ack_p95_ms","spark_ack_latency_ms_p95","orders_place_ack_ms_p95"),
  event_to_db_p95_ms: pick("event_to_db_p95_ms","spark_event_to_db_ms_p95"),
  ingest_lag_p95_s: pick("ingest_lag_p95_s","spark_ingest_lag_seconds_p95"),
  seq_gap_total: pick("seq_gap_total","spark_sequence_gap_total")
};
const unknown = Object.values(gates).some(v=>v===undefined);
const breach = (!unknown) && (
  gates.ack_p95_ms >= THR.ack_p95_ms ||
  gates.event_to_db_p95_ms >= THR.event_to_db_p95_ms ||
  gates.ingest_lag_p95_s > THR.ingest_lag_p95_s ||
  gates.seq_gap_total > THR.seq_gap_total
);

const ts = new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,12);
const dir = path.resolve(process.cwd(),"evidence","canary","alerts");
fs.mkdirSync(dir,{recursive:true});
const out = path.join(dir, `${ts}.json`);
fs.writeFileSync(out, JSON.stringify({ ts, pull:PULL, gates, thresholds:THR, unknown, breach }, null, 2), "utf8");

console.log(breach ? "ALERT: breach" : (unknown ? "WARN: unknown metrics" : "OK"));
process.exit(breach ? 2 : 0); 