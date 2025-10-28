import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { BacktestRun, BacktestStatusResponse } from "../types/backtest.js";
import { gBacktestActive, observeRunSample } from "../metrics/backtest-metrics.js";
import fs from "node:fs/promises";
import path from "node:path";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "backtest");

/**
 * Read backtest runs from evidence directory
 */
async function readEvidenceRuns(): Promise<BacktestRun[]> {
  try {
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    const files = await fs.readdir(EVIDENCE_DIR);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    
    const runs: BacktestRun[] = [];
    for (const file of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(EVIDENCE_DIR, file), "utf8");
        const data = JSON.parse(raw);
        
        // Support both array format and single run format
        if (Array.isArray(data?.runs)) {
          runs.push(...data.runs);
        } else if (data?.id) {
          runs.push(data);
        }
      } catch (err) {
        // Skip malformed files
        console.warn(`[backtest] Failed to parse ${file}:`, err);
      }
    }
    
    return runs;
  } catch (err) {
    // Evidence dir doesn't exist or not readable
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
  
  // Calculate percentiles if we have duration data
  if (durations.length > 0) {
    durations.sort((a, b) => a - b);
    const p50Idx = Math.floor(durations.length * 0.5);
    const p95Idx = Math.floor(durations.length * 0.95);
    stats.p50DurationSec = durations[p50Idx];
    stats.p95DurationSec = durations[p95Idx];
  }
  
  return stats;
}

export default fp(async function backtestPlugin(app: FastifyInstance) {
  /**
   * GET /api/backtest/status
   * Returns list of backtest runs + aggregated stats
   */
  app.get("/api/backtest/status", async (req, reply) => {
    try {
      // Read from evidence (future: also check in-memory store)
      const runs = await readEvidenceRuns();
      
      // Calculate stats
      const stats = calculateStats(runs);
      
      // Update metrics (idempotent - gauge is safe to set repeatedly)
      gBacktestActive.set(stats.running);
      
      // Observe samples for histogram (idempotent for read-only)
      for (const run of runs) {
        if (run.status === "done" || run.status === "failed") {
          observeRunSample(run);
        }
      }
      
      const response: BacktestStatusResponse = { runs, stats };
      return reply.send(response);
    } catch (err: any) {
      app.log.error({ err }, "[backtest] Failed to fetch status");
      return reply.code(500).send({
        error: "Failed to fetch backtest status",
        message: err?.message,
      });
    }
  });
  
  /**
   * GET /api/backtest/runs/:id
   * Returns individual run detail
   */
  app.get("/api/backtest/runs/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const runs = await readEvidenceRuns();
      const run = runs.find(r => r.id === id);
      
      if (!run) {
        return reply.code(404).send({
          error: "Run not found",
          runId: id,
        });
      }
      
      return reply.send(run);
    } catch (err: any) {
      app.log.error({ err }, "[backtest] Failed to fetch run detail");
      return reply.code(500).send({
        error: "Failed to fetch run detail",
        message: err?.message,
      });
    }
  });
});

