import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type State = "queued"|"running"|"done"|"failed"|"canceled";
type Job = {
  id: string;
  type: string;
  priority: number;         // 1 (low) .. 5 (high)
  state: State;
  createdAt: number;        // epoch ms
  etaSec?: number | null;   // seconds
  progress?: number;        // 0..100
  runtimeMs?: number;       // if done/failed
  format?: "csv"|"pdf"|"parquet"|"other";
};

async function tryFetch(url: string, init?: RequestInit) {
  try {
    const r = await fetch(url, { ...init, cache: "no-store", next: { revalidate: 0 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function readEvidence<T=any>(rel: string): Promise<T | null> {
  try {
    const p = path.join(process.cwd(), "..", "..", rel);
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt) as T;
  } catch { return null; }
}

function mockQueue(): Job[] {
  const now = Date.now();
  return [
    { id:"job_csv_001", type:"export", format:"csv", priority:3, state:"running", createdAt:now-20_000, etaSec:10, progress:66 },
    { id:"job_pdf_002", type:"export", format:"pdf", priority:2, state:"queued",  createdAt:now-15_000, etaSec:120, progress:0 },
    { id:"job_csv_003", type:"export", format:"csv", priority:5, state:"queued",  createdAt:now-5_000,  etaSec:90,  progress:0 },
    { id:"job_csv_000", type:"export", format:"csv", priority:1, state:"done",    createdAt:now-120_000, runtimeMs:4_200, progress:100 },
  ];
}

export async function GET() {
  // Öncelik: gerçek servis → evidence → mock
  const svc = await tryFetch("http://127.0.0.1:4001/optimizer/queue");
  const ev  = await readEvidence<Job[]>("evidence/optimizer/queue.json");
  const rows: Job[] = Array.isArray(svc?.jobs) ? svc.jobs
                 : Array.isArray(ev) ? ev
                 : mockQueue();

  // quick stats
  const stats = {
    running: rows.filter(x=>x.state==="running").length,
    queued:  rows.filter(x=>x.state==="queued").length,
    done:    rows.filter(x=>x.state==="done").length,
    failed:  rows.filter(x=>x.state==="failed").length,
    total24h: rows.length, // istersen timestamp filtresi uygula
  };

  return NextResponse.json({ updatedAt: Date.now(), rows, stats });
}

