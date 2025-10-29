import { FastifyRequest, FastifyReply } from "fastify";
import { backtestJobDurationSeconds } from "../metrics";

const activeJobs = new Map<string, any>();

export default async function (fastify: any) {
  // Create backtest job
  fastify.post(
    "/backtest/job",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as any;

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start mock job processing
      const job = {
        id: jobId,
        status: "pending",
        progress: 0,
        step: "Initializing...",
        startedAt: new Date().toISOString(),
        strategy: body.strategy || "default",
        symbol: body.symbol || "BTCUSDT",
        timeframe: body.timeframe || "1h",
        startDate: body.startDate || "2024-05-01",
        endDate: body.endDate || "2024-06-01",
      };

      activeJobs.set(jobId, job);

      // Simulate job processing (in real impl, this would be a background worker)
      setTimeout(() => simulateJobProgress(jobId), 500);

      return reply.send({ jobId, status: "pending" });
    }
  );

  // SSE stream for job progress
  fastify.get(
    "/backtest/stream/:jobId",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { jobId } = req.params as any;

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const sendEvent = (data: any) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial connection
      sendEvent({ type: "connected", jobId });

      // Poll job status
      const interval = setInterval(() => {
        const job = activeJobs.get(jobId);

        if (!job) {
          sendEvent({ type: "error", message: "Job not found" });
          clearInterval(interval);
          reply.raw.end();
          return;
        }

        sendEvent({
          type: "progress",
          progress: job.progress,
          step: job.step,
          status: job.status,
        });

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          reply.raw.end();
        }
      }, 500);

      // Cleanup on disconnect
      req.raw.on("close", () => {
        clearInterval(interval);
        reply.raw.end();
      });
    }
  );

  // Get job report
  fastify.get(
    "/backtest/report/:jobId",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { jobId } = req.params as any;
      const job = activeJobs.get(jobId);

      if (!job) {
        return reply.status(404).send({ error: "Job not found" });
      }

      // Mock report data
      const report = {
        jobId: job.id,
        status: job.status,
        metrics: {
          totalTrades: 127,
          winRate: 0.5433,
          profitFactor: 1.45,
          maxDrawdown: -0.1234,
          sharpeRatio: 1.85,
          totalReturn: 0.3456,
          avgWinLoss: 1.67,
        },
        equityCurve: generateMockEquityCurve(),
        trades: generateMockTrades(),
      };

      return reply.send(report);
    }
  );
}

function generateMockEquityCurve() {
  const days = 30;
  let equity = 10000;
  const curve = [{ date: "2024-05-01", equity: 10000 }];

  for (let i = 1; i <= days; i++) {
    const change = (Math.random() - 0.45) * 200; // Slight positive bias
    equity = Math.max(8000, equity + change);
    curve.push({
      date: `2024-05-${(i + 1).toString().padStart(2, "0")}`,
      equity: Math.round(equity * 100) / 100,
    });
  }

  return curve;
}

function generateMockTrades() {
  const trades = [];
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];

  for (let i = 0; i < 20; i++) {
    const isWin = Math.random() > 0.45;
    trades.push({
      id: `trade_${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.5 ? "BUY" : "SELL",
      entryPrice: 45000 + Math.random() * 5000,
      exitPrice: 0,
      quantity: 0.1 + Math.random() * 0.4,
      pnl: isWin ? 50 + Math.random() * 200 : -30 - Math.random() * 150,
      win: isWin,
      entryTime: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
    });
  }

  return trades;
}

function simulateJobProgress(jobId: string) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  const steps = [
    { progress: 10, step: "Loading historical data..." },
    { progress: 25, step: "Calculating indicators..." },
    { progress: 40, step: "Running simulation..." },
    { progress: 60, step: "Evaluating trades..." },
    { progress: 80, step: "Computing metrics..." },
    { progress: 90, step: "Generating report..." },
    { progress: 100, step: "Completed", status: "completed" },
  ];

  let stepIndex = 0;
  const interval = setInterval(() => {
    if (stepIndex >= steps.length) {
      clearInterval(interval);
      return;
    }

    const current = steps[stepIndex];
    job.progress = current.progress;
    job.step = current.step;
    if (current.status) job.status = current.status;

    activeJobs.set(jobId, job);

    // Observe metrics when completed
    if (current.status === "completed") {
      const duration = (Date.now() - new Date(job.startedAt).getTime()) / 1000;
      backtestJobDurationSeconds.observe(duration);
    }

    stepIndex++;
  }, 2000);
}
