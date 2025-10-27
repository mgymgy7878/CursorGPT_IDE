import fs from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";

const BASE = process.env.REPORT_HTTP_BASE || "http://127.0.0.1:4001";
const DIR  = process.env.REPORTS_DIR || "runtime/reports";

let currentId: string | null = null;

function ts(){ return new Date().toISOString().replace(/[:.]/g,"-"); }
async function safeWrite(p:string, data:any){
  const tmp = p + ".tmp";
  await fs.writeFile(tmp, typeof data==="string" ? data : JSON.stringify(data,null,2));
  await fs.rename(tmp, p);
}
async function ensureDir(d:string){ await fs.mkdir(d, { recursive: true }); }

export async function beginReportSession(id?:string){
  currentId = id ?? `rpt-${ts()}`;
  const base = path.join(DIR, currentId);
  await ensureDir(path.join(base, "snapshots"));
  await safeWrite(path.join(base, "index.json"), { id: currentId, startedAt: new Date().toISOString() });
  return { id: currentId, dir: base };
}

async function getMetricsText(){
  const r = await fetch(`${BASE}/api/public/metrics/prom`);
  return await r.text();
}
function scrapeMetric(txt:string, name:string){
  const re = new RegExp(`^${name}\\s+(\\d+(?:\\.\\d+)?)$`, "m");
  const m = txt.match(re);
  return m ? Number(m[1]) : null;
}

export async function snapshot(){
  if(!currentId) await beginReportSession();
  const id = currentId!;
  const base = path.join(DIR, id);

  // inputs (tolerant fetches)
  async function j(url:string){ try{ const r=await fetch(url); return await r.json(); }catch{ return null; } }
  const [pnl, positions, ws, risk, symbols] = await Promise.all([
    j(`${BASE}/api/private/pnl/summary`),
    j(`${BASE}/api/private/pnl/positions`),
    j(`${BASE}/api/private/websocket/status`),
    j(`${BASE}/api/private/risk/rules`),
    j(`${BASE}/api/private/symbols`)
  ]);

  const metricsText = await getMetricsText();
  const snapshotObj = {
    ts: new Date().toISOString(),
    pnl, positions, ws, risk, symbols,
    metrics: {
      private_calls: scrapeMetric(metricsText, "spark_private_calls_total"),
      private_errors: scrapeMetric(metricsText, "spark_private_errors_total"),
      twap_slices: scrapeMetric(metricsText, "spark_twap_slice_sent_total"),
      ws_disc: scrapeMetric(metricsText, "spark_ws_disconnects_total"),
      risk_breaches: scrapeMetric(metricsText, "spark_risk_breach_total"),
    }
  };

  // write JSON + CSV row
  const snapFile = path.join(base, "snapshots", `${Date.now()}.json`);
  await safeWrite(snapFile, snapshotObj);

  const row = [
    snapshotObj.ts,
    snapshotObj.metrics.private_calls ?? "",
    snapshotObj.metrics.private_errors ?? "",
    snapshotObj.metrics.twap_slices ?? "",
    snapshotObj.metrics.ws_disc ?? "",
    snapshotObj.metrics.risk_breaches ?? "",
    (pnl as any)?.unrealized ?? "", (pnl as any)?.realized ?? ""
  ].join(",") + "\n";
  await fs.appendFile(path.join(base, "report.csv"),
    "ts,private_calls,private_errors,twap_slices,ws_disc,risk_breaches,unrealized,realized\n" + row,
    { flag: "a" });

  // bump metrics (optional: integrate with your metrics emitter)
  // spark_report_runs_total++
  return { id, wrote: path.basename(snapFile) };
}

export async function finalize(){
  if(!currentId) throw new Error("NO_SESSION");
  const id = currentId!;
  const base = path.join(DIR, id);
  const files = (await fs.readdir(path.join(base, "snapshots"))).filter(f=>f.endsWith(".json"));
  const snaps: any[] = [];
  for (const f of files.sort()) {
    const j = JSON.parse(await fs.readFile(path.join(base,"snapshots",f), "utf8"));
    snaps.push(j);
  }
  const n = snaps.length || 1;
  const first = snaps[0] || {};
  const last  = snaps[snaps.length-1] || {};

  const sum = (key:(s:any)=>number)=> snaps.reduce((a,s)=> a + (Number(key(s))||0), 0);
  const max = (key:(s:any)=>number)=> snaps.reduce((a,s)=> Math.max(a, Number(key(s))||0), 0);

  const report = {
    id,
    startedAt: first?.ts ?? null,
    endedAt: last?.ts ?? null,
    samples: snaps.length,
    metrics: {
      private_calls_total: last?.metrics?.private_calls ?? null,
      private_errors_total: last?.metrics?.private_errors ?? null,
      ws_disconnects_total: last?.metrics?.ws_disc ?? null,
      risk_breaches_total: last?.metrics?.risk_breaches ?? null,
      twap_slices_total: last?.metrics?.twap_slices ?? null,
      avg_unrealized: sum(s=>(s.pnl as any)?.unrealized)/n,
      avg_realized: sum(s=>(s.pnl as any)?.realized)/n,
      max_unrealized: max(s=>(s.pnl as any)?.unrealized),
      max_drawdown: max(s=>-((s.pnl as any)?.unrealized??0)) * -1 // basit approx
    },
    ok: true
  };

  await safeWrite(path.join(base, "report.json"), report);
  await safeWrite(path.join(DIR, "latest.json"), { id, summary: report });
  return report;
} 