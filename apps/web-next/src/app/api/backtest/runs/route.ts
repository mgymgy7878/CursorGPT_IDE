import { NextResponse } from "next/server";
import { BacktestListResponse, BacktestRun } from "@/types/backtest";
import fs from "node:fs/promises";
import path from "node:path";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "backtest");

async function fetchWithTimeout(url: string, ms = 1000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function normalizeExecutor(json: any): BacktestRun[] {
  if (!json || !Array.isArray(json.runs)) return [];
  return json.runs.map((r: any) => ({
    id: String(r.id ?? r.runId),
    startedAt: r.startedAt ?? new Date().toISOString(),
    finishedAt: r.finishedAt,
    status: r.status,
    metrics: {
      auc: r.metrics?.auc,
      sharpe: r.metrics?.sharpe,
      maxDrawdown: r.metrics?.maxDrawdown,
      winRate: r.metrics?.winRate,
      pnl: r.metrics?.pnl,
    },
    equity: r.equity,
    artifacts: r.artifacts,
    notes: r.notes,
  }));
}

async function readEvidence(): Promise<BacktestRun[]> {
  try {
    const files = await fs.readdir(EVIDENCE_DIR);
    const jsons = files.filter(f => f.endsWith(".json"));
    const runs: BacktestRun[] = [];
    for (const f of jsons) {
      const raw = await fs.readFile(path.join(EVIDENCE_DIR, f), "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data?.runs)) {
        runs.push(...normalizeExecutor({ runs: data.runs }));
      } else if (data?.id) {
        runs.push(normalizeExecutor({ runs: [data] })[0]);
      }
    }
    return runs;
  } catch {
    return [];
  }
}

function mock(): BacktestRun[] {
  const now = Date.now();
  return [
    {
      id: "bt-mock-001",
      startedAt: new Date(now - 60 * 60 * 1000).toISOString(),
      finishedAt: new Date(now - 20 * 60 * 1000).toISOString(),
      status: "done",
      metrics: { auc: 0.63, sharpe: 1.12, maxDrawdown: -0.18, winRate: 0.57, pnl: 12450 },
      artifacts: {
        equityCsv: "/api/backtest/artifacts/equity_mock.csv",
        tradesCsv: "/api/backtest/artifacts/trades_mock.csv",
        reportPdf: "/api/backtest/artifacts/report_mock.pdf",
      },
      notes: "Sample run (mock)",
    },
    {
      id: "bt-mock-002",
      startedAt: new Date(now - 10 * 60 * 1000).toISOString(),
      status: "running",
      metrics: { auc: 0.61, sharpe: 0.95, maxDrawdown: -0.22, winRate: 0.54 },
    },
  ];
}

export async function GET() {
  const execUrl = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
  const fromExec = await fetchWithTimeout(`${execUrl}/backtest/status`, 800);
  let runs: BacktestRun[] = normalizeExecutor(fromExec);
  if (!runs.length) runs = await readEvidence();
  if (!runs.length) runs = mock();

  const stats = {
    total: runs.length,
    running: runs.filter(r => r.status === "running").length,
    queued: runs.filter(r => r.status === "queued").length,
    done: runs.filter(r => r.status === "done").length,
    failed: runs.filter(r => r.status === "failed").length,
  };

  const body: BacktestListResponse = { runs, stats };
  return NextResponse.json(body, { status: 200 });
}

