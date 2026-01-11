import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mock audit data when executor is unavailable
const mockActions = [
  {
    id: "mock-1",
    action: "strategy.preview",
    result: "ok" as const,
    timestamp: Date.now() - 30000,
    details: "BTCUSDT 1h strategy preview",
    traceId: "ui-mock-1"
  },
  {
    id: "mock-2",
    action: "canary.run",
    result: "ok" as const,
    timestamp: Date.now() - 60000,
    details: "Dry-run canary test",
    traceId: "ui-mock-2"
  },
  {
    id: "mock-3",
    action: "tools.get_metrics",
    result: "ok" as const,
    timestamp: Date.now() - 90000,
    details: "Market metrics fetch",
    traceId: "ui-mock-3"
  },
  {
    id: "mock-4",
    action: "strategy.generate",
    result: "ok" as const,
    timestamp: Date.now() - 120000,
    details: "AI strategy generation",
    traceId: "ui-mock-4"
  },
  {
    id: "mock-5",
    action: "backtest.run",
    result: "ok" as const,
    timestamp: Date.now() - 150000,
    details: "Portfolio backtest",
    traceId: "ui-mock-5"
  }
];

// Transform Executor audit log to UI format
function transformAuditLog(log: any): any {
  const status = log.action.includes("error") || log.action.includes("failed") ? "error"
    : log.action.includes("warn") ? "warn"
    : "ok";

  return {
    auditId: log.id,
    time: log.timestamp,
    actor: log.actor,
    action: log.action,
    target: log.payload?.strategyId || log.payload?.tradeId || log.payload?.positionId || undefined,
    status,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const actor = searchParams.get("actor") || undefined;
  const limit = parseInt(searchParams.get("limit") || searchParams.get("size") || "6", 10);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const executorUrl = new URL(`${EXECUTOR_BASE}/v1/audit`);
    if (action) executorUrl.searchParams.set("action", action);
    if (actor) executorUrl.searchParams.set("actor", actor);
    if (cursor) executorUrl.searchParams.set("cursor", cursor);
    executorUrl.searchParams.set("limit", limit.toString());

    const response = await fetch(executorUrl.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.data) {
        const items = data.data.map(transformAuditLog);
        return NextResponse.json({
          items,
          total: data.count || items.length,
          hasMore: data.hasMore || false,
          nextCursor: data.nextCursor || null,
          _mock: false,
        }, { status: 200 });
      }
    }

    // Executor returned error, use mock data
    return NextResponse.json({
      items: mockActions.slice(0, limit).map((m, i) => ({
        ...m,
        auditId: m.id,
        time: new Date(m.timestamp).toISOString(),
      })),
      total: mockActions.length,
      _err: `Executor error: ${response.statusText}`,
      _mock: true
    }, { status: 200 });
  } catch (e: any) {
    // Executor unreachable, use mock data
    return NextResponse.json({
      items: mockActions.slice(0, limit).map((m, i) => ({
        ...m,
        auditId: m.id,
        time: new Date(m.timestamp).toISOString(),
      })),
      total: mockActions.length,
      _err: `Executor unavailable: ${e?.message ?? "connection-failed"}`,
      _mock: true
    }, { status: 200 });
  }
}

// Legacy POST support (backward compatibility)
export async function POST(req: Request) {
  return GET(req);
}
