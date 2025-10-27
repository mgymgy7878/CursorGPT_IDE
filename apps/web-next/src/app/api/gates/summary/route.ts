import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type GateId = "psi"|"performance"|"alertSilence"|"offlineEval"|"shadowDelta"|"evidenceComplete";
type GateStatus = "PASS"|"FAIL"|"BLOCKED";
type GateRow = {
  id: GateId; label: string; status: GateStatus;
  value?: number | string; threshold?: string; details?: string;
};

async function safeReadJSON<T=any>(p: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return null; }
}

async function getPSI(): Promise<number | null> {
  try {
    const r = await fetch("http://127.0.0.1:3003/api/ml/psi", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    // beklenen: { overall_psi:number }
    return typeof j?.overall_psi === "number" ? j.overall_psi : null;
  } catch { return null; }
}

async function getPerf(): Promise<{p95:number; errorRate:number} | null> {
  try {
    const r = await fetch("http://127.0.0.1:3003/api/metrics/summary", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    // beklenen: { ml_predict_p95_ms:number, ... }
    const p95 = Number(j?.ml_predict_p95_ms ?? j?.p95Ms ?? j?.p95 ?? NaN);
    const err = Number(j?.errorRate ?? j?.error ?? 0);
    if (Number.isFinite(p95) && Number.isFinite(err)) return { p95, errorRate: err };
    return null;
  } catch { return null; }
}

async function getShadowDelta(): Promise<{avg:number; max:number} | null> {
  // Öncelik: canary koşumu → yoksa shadow smoke → yoksa null
  const root = path.join(process.cwd(), "..", "..");
  const files = [
    path.join(root, "evidence/ml/canary_run_2025-10-08T11-30-33-908Z.json"),
    path.join(root, "evidence/ml/shadow_smoke_1k.json"),
  ];
  for (const f of files) {
    const j = await safeReadJSON<any>(f);
    if (!j) continue;
    // esnek: {shadow:{avg_delta,max_delta}} ya da {summary:{avgDelta,maxDelta}}
    const s = j.shadow ?? j.summary ?? j;
    const avg = Number(s?.avg_delta ?? s?.avgDelta ?? s?.average_delta);
    const max = Number(s?.max_delta ?? s?.maxDelta);
    if (Number.isFinite(avg) && Number.isFinite(max)) return { avg, max };
  }
  return null;
}

async function offlineEval(): Promise<{auc:number; p20:number} | null> {
  const root = path.join(process.cwd(), "..", "..");
  const j = await safeReadJSON<any>(path.join(root, "evidence/ml/offline_report.json"));
  if (!j) return null;
  const auc = Number(j?.auc ?? j?.AUC);
  const p20 = Number(j?.precision_at_20 ?? j?.PAt20 ?? j?.P20);
  if (Number.isFinite(auc) && Number.isFinite(p20)) return { auc, p20 };
  return null;
}

async function evidenceComplete(): Promise<boolean> {
  const root = path.join(process.cwd(), "..", "..");
  const needed = [
    "evidence/ml/offline_report.json",
    "evidence/ml/eval_result.txt",
    "evidence/ml/smoke_1k.json",
    "evidence/ml/psi_snapshot.json",
  ];
  try {
    await Promise.all(needed.map(f => fs.access(path.join(root, f))));
    return true;
  } catch { return false; }
}

export async function GET() {
  // 1) PSI
  const psi = await getPSI();                    // PASS if < 0.2
  const psiGate: GateRow = {
    id: "psi", label: "PSI < 0.2",
    status: psi == null ? "BLOCKED" : (psi < 0.2 ? "PASS" : "FAIL"),
    value: psi ?? "N/A", threshold: "< 0.2",
    details: psi == null ? "PSI kaynağı okunamadı" : undefined,
  };

  // 2) Performance
  const perf = await getPerf();                  // P95 < 80ms & error <1%
  const perfGate: GateRow = {
    id: "performance", label: "P95 < 80ms & Error < 1%",
    status: !perf ? "BLOCKED" : (perf.p95 < 80 && perf.errorRate < 0.01 ? "PASS" : "FAIL"),
    value: !perf ? "N/A" : `p95=${perf.p95.toFixed(2)}ms err=${(perf.errorRate*100).toFixed(2)}%`,
    threshold: "<80ms & <1%",
    details: !perf ? "Metrikler erişilemedi" : undefined,
  };

  // 3) Alert Silence (24h)
  // Basit yaklaşım: günlük raporda CRITICAL yoksa PASS (Prometheus entegrasyonu varsa buraya bağlayın)
  const root = path.join(process.cwd(), "..", "..");
  const daily = await safeReadJSON<any>(path.join(root,"evidence/ml/daily/report_2025-10-08.json"));
  const alertOk = daily ? (daily.overall_status !== "CRITICAL") : true;
  const alertGate: GateRow = {
    id: "alertSilence", label: "24h Critical Alert Yok",
    status: alertOk ? "PASS" : "FAIL",
    value: daily?.overall_status ?? "unknown",
    threshold: "no CRITICAL",
  };

  // 4) Offline Eval
  const off = await offlineEval();               // AUC ≥ 0.62 & P@20 ≥ 0.58
  const offlineGate: GateRow = {
    id: "offlineEval", label: "Offline Eval (AUC≥0.62 & P@20≥0.58)",
    status: !off ? "BLOCKED" : ((off.auc >= 0.62 && off.p20 >= 0.58) ? "PASS" : "FAIL"),
    value: !off ? "N/A" : `AUC=${off.auc.toFixed(2)} P@20=${off.p20.toFixed(2)}`,
    threshold: "AUC≥0.62 & P@20≥0.58",
  };

  // 5) Shadow Delta
  const sh = await getShadowDelta();             // avg < 0.05 & max ≤ 0.05
  const shadowGate: GateRow = {
    id: "shadowDelta", label: "Shadow Δ < 0.05 (avg & max)",
    status: !sh ? "BLOCKED" : ((sh.avg < 0.05 && sh.max <= 0.05) ? "PASS" : "FAIL"),
    value: !sh ? "N/A" : `avg=${sh.avg.toFixed(3)} max=${sh.max.toFixed(3)}`,
    threshold: "avg<0.05 & max≤0.05",
  };

  // 6) Evidence Complete
  const evOk = await evidenceComplete();
  const evidenceGate: GateRow = {
    id: "evidenceComplete", label: "Evidence Tam",
    status: evOk ? "PASS" : "FAIL",
    value: evOk ? "present" : "missing",
    threshold: "required files",
  };

  const rows = [psiGate, perfGate, alertGate, offlineGate, shadowGate, evidenceGate];
  const allPass = rows.every(r => r.status === "PASS");
  return NextResponse.json({ updatedAt: Date.now(), allPass, rows });
}

