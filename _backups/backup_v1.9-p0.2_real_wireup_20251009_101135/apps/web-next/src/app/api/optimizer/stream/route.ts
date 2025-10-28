import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type State = "queued"|"running"|"done"|"failed"|"canceled";
type Job = {
  id: string;
  type: string;
  priority: number;
  state: State;
  createdAt: number;
  etaSec?: number | null;
  progress?: number;
  runtimeMs?: number;
  format?: "csv"|"pdf"|"parquet"|"other";
};

async function tryFetch(url: string) {
  try {
    const r = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
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
    { id:"job_csv_001", type:"export", format:"csv", priority:3, state:"running", createdAt:now-20_000, etaSec:10, progress:66 + Math.floor(Math.random() * 10) },
    { id:"job_pdf_002", type:"export", format:"pdf", priority:2, state:"queued",  createdAt:now-15_000, etaSec:120, progress:0 },
    { id:"job_csv_003", type:"export", format:"csv", priority:5, state:"queued",  createdAt:now-5_000,  etaSec:90,  progress:0 },
  ];
}

async function getSnapshot() {
  const svc = await tryFetch("http://127.0.0.1:4001/optimizer/queue");
  const ev  = await readEvidence<Job[]>("evidence/optimizer/queue.json");
  const rows: Job[] = Array.isArray(svc?.jobs) ? svc.jobs
                 : Array.isArray(ev) ? ev
                 : mockQueue();
  
  const stats = {
    running: rows.filter(x=>x.state==="running").length,
    queued:  rows.filter(x=>x.state==="queued").length,
    done:    rows.filter(x=>x.state==="done").length,
    failed:  rows.filter(x=>x.state==="failed").length,
  };
  
  return { updatedAt: Date.now(), rows, stats };
}

// SSE stream
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Initial data push
      const initial = await getSnapshot();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));
      
      // Periodic updates (every 2 seconds)
      const interval = setInterval(async () => {
        try {
          const snapshot = await getSnapshot();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
        } catch (error) {
          console.error("SSE snapshot error:", error);
          // Send error event
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "snapshot failed" })}\n\n`));
        }
      }, 2000);
      
      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
      
      // Keep-alive ping every 30s
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive\n\n`));
      }, 30000);
      
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Nginx compatibility
    },
  });
}

