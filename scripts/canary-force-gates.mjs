#!/usr/bin/env node
/**
 * Son NONCE için latency.gates değerlerini günceller.
 * Kullanım:
 *  - OK senaryosu: node scripts/canary-force-gates.mjs ok
 *  - Kötü senaryo: node scripts/canary-force-gates.mjs bad
 */
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(process.cwd(),"evidence","canary");
if (!fs.existsSync(root)) { console.error("evidence/canary not found"); process.exit(2); }
const dirs = fs.readdirSync(root).filter(d=>fs.existsSync(path.join(root,d,"plan.json"))).sort();
if (!dirs.length) { console.error("no NONCE dirs"); process.exit(2); }
const nonce = dirs[dirs.length-1];
const latencyPath = path.join(root,nonce,"latency.json");
const obj = fs.existsSync(latencyPath) ? JSON.parse(fs.readFileSync(latencyPath,"utf8")) : { gates:{} };
const mode = (process.argv[2]||"ok").toLowerCase();

if (mode === "ok") {
  obj.gates = { ack_p95_ms: 250, event_to_db_p95_ms: 90, ingest_lag_p95_s: 1, seq_gap_total: 0, slippage_p95_bps: 10, clock_drift_ms_p95: 100 };
} else {
  obj.gates = { ack_p95_ms: 2000, event_to_db_p95_ms: 900, ingest_lag_p95_s: 9, seq_gap_total: 3, slippage_p95_bps: 50, clock_drift_ms_p95: 2000 };
}
fs.writeFileSync(latencyPath, JSON.stringify(obj,null,2), "utf8");
console.log("UPDATED", latencyPath, "mode=", mode, "nonce=", nonce); 