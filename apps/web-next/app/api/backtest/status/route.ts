export const dynamic = "force-dynamic";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "test-secret-123";
const MODE = process.env.BACKTEST_MODE ?? "mock";

export async function GET() {
  if (MODE === "executor") {
    try {
      const r = await fetch(`${EXECUTOR_URL}/api/backtest/status`, {
        headers: { "x-admin-token": ADMIN_TOKEN },
        cache: "no-store",
      });
      const data = await r.json().catch(() => ({}));
      return Response.json(data, { status: r.status });
    } catch (e) {
      return Response.json({ error: "Executor unavailable" }, { status: 503 });
    }
  }

  // mock
  const queue = (globalThis.__mockQueue as any[]) ?? [];
  const stats = {
    queued: queue.filter((x) => x.status === "queued").length,
    running: queue.filter((x) => x.status === "running").length,
    done: queue.filter((x) => x.status === "done").length,
  };
  return Response.json({ queue, stats }, { status: 200 });
}