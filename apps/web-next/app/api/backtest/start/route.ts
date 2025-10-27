export const dynamic = "force-dynamic";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "test-secret-123";
const MODE = process.env.BACKTEST_MODE ?? "mock";

// Basit güvenlik – UI'dan token gelmesin
function authHeaders() {
  return { "x-admin-token": ADMIN_TOKEN, "content-type": "application/json" };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (MODE === "executor") {
    try {
      const r = await fetch(`${EXECUTOR_URL}/api/backtest/start`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = await r.json().catch(() => ({}));
      return Response.json(data, { status: r.status });
    } catch (e) {
      return Response.json({ error: "Executor unavailable" }, { status: 503 });
    }
  }

  // fallback: mock (geçici)
  const id = `bt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  globalThis.__mockQueue ??= [];
  globalThis.__mockQueue.push({ 
    id, 
    pair: body.pair ?? "ETHUSDT", 
    timeframe: body.timeframe ?? "4h", 
    status: "queued", 
    ts: Date.now() 
  });
  
  setTimeout(() => {
    const q = globalThis.__mockQueue as any[];
    const it = q.find((x) => x.id === id);
    if (it) it.status = "done";
  }, 3500);
  
  return Response.json({ id, status: "queued" }, { status: 201 });
}