import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { BacktestRun, BacktestStatusResponse } from "../types/backtest.js";
import { gBacktestStreamClients } from "../metrics/backtest-metrics.js";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "backtest");
const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 15000;

/**
 * Read backtest runs from evidence directory
 */
async function readEvidenceRuns(): Promise<BacktestRun[]> {
  try {
    const files = await fs.promises.readdir(EVIDENCE_DIR);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    
    const runs: BacktestRun[] = [];
    for (const file of jsonFiles) {
      try {
        const raw = await fs.promises.readFile(path.join(EVIDENCE_DIR, file), "utf8");
        const data = JSON.parse(raw);
        
        if (Array.isArray(data?.runs)) {
          runs.push(...data.runs);
        } else if (data?.id) {
          runs.push(data);
        }
      } catch (err) {
        // Skip malformed files
      }
    }
    
    return runs;
  } catch (err) {
    return [];
  }
}

/**
 * Calculate stats from runs array
 */
function calculateStats(runs: BacktestRun[]): BacktestStatusResponse["stats"] {
  const stats = {
    total: runs.length,
    running: 0,
    queued: 0,
    done: 0,
    failed: 0,
  };
  
  const durations: number[] = [];
  
  for (const run of runs) {
    if (run.status === "running") stats.running++;
    else if (run.status === "queued") stats.queued++;
    else if (run.status === "done") stats.done++;
    else if (run.status === "failed") stats.failed++;
    
    if (run.finishedAt && run.startedAt) {
      const dur = (run.finishedAt - run.startedAt) / 1000;
      if (dur >= 0) durations.push(dur);
    }
  }
  
  if (durations.length > 0) {
    durations.sort((a, b) => a - b);
    const p50Idx = Math.floor(durations.length * 0.5);
    const p95Idx = Math.floor(durations.length * 0.95);
    stats.p50DurationSec = durations[p50Idx];
    stats.p95DurationSec = durations[p95Idx];
  }
  
  return stats;
}

/**
 * Generate snapshot response
 */
async function getSnapshot(): Promise<BacktestStatusResponse> {
  const runs = await readEvidenceRuns();
  const stats = calculateStats(runs);
  return { runs, stats };
}

/**
 * Simple hash for change detection
 */
function hashSnapshot(snapshot: BacktestStatusResponse): string {
  return JSON.stringify({
    total: snapshot.stats.total,
    running: snapshot.stats.running,
    done: snapshot.stats.done,
    failed: snapshot.stats.failed,
    runIds: snapshot.runs.map(r => r.id).sort(),
  });
}

export default fp(async function backtestStreamPlugin(app: FastifyInstance) {
  /**
   * GET /api/backtest/stream
   * Server-Sent Events endpoint for real-time backtest updates
   */
  app.get("/api/backtest/stream", async (req, reply: FastifyReply) => {
    // Set SSE headers
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Nginx buffering bypass
    });

    // Increment active clients metric
    gBacktestStreamClients.inc();
    app.log.info("[backtest-stream] Client connected");

    let pollInterval: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let lastHash = "";

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      gBacktestStreamClients.dec();
      app.log.info("[backtest-stream] Client disconnected");
    };

    // Handle client disconnect
    req.raw.on("close", cleanup);
    req.raw.on("error", cleanup);

    // Send initial snapshot
    try {
      const snapshot = await getSnapshot();
      lastHash = hashSnapshot(snapshot);
      const data = JSON.stringify(snapshot);
      reply.raw.write(`event: snapshot\ndata: ${data}\n\n`);
    } catch (err) {
      app.log.error({ err }, "[backtest-stream] Failed to send snapshot");
      reply.raw.end();
      cleanup();
      return;
    }

    // Heartbeat to keep connection alive
    heartbeatInterval = setInterval(() => {
      try {
        reply.raw.write(`:hb\n\n`);
      } catch (err) {
        cleanup();
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Poll for changes
    pollInterval = setInterval(async () => {
      try {
        const snapshot = await getSnapshot();
        const currentHash = hashSnapshot(snapshot);
        
        if (currentHash !== lastHash) {
          lastHash = currentHash;
          const data = JSON.stringify(snapshot);
          reply.raw.write(`event: update\ndata: ${data}\n\n`);
          app.log.debug("[backtest-stream] Update sent to client");
        }
      } catch (err) {
        app.log.error({ err }, "[backtest-stream] Failed to poll updates");
      }
    }, POLL_INTERVAL_MS);

    // Keep reply open (will be closed by client disconnect or error)
  });
});

