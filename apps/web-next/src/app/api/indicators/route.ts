import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aggregated indicators endpoint
 * Fetches multiple metrics in a single request for navigation badges
 */
export async function GET() {
  try {
    const [strategiesRes, positionsRes, auditRes] = await Promise.allSettled([
      fetch(`${EXECUTOR_BASE}/v1/strategies?status=active&limit=1`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${EXECUTOR_BASE}/v1/positions/open?limit=1`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${EXECUTOR_BASE}/v1/audit?limit=20`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    const indicators: any = {
      strategies: {
        active: 0,
        _mock: false,
      },
      positions: {
        open: 0,
        _mock: false,
      },
      audit: {
        recent: 0,
        _mock: false,
      },
    };

    // Parse strategies count
    if (strategiesRes.status === "fulfilled" && strategiesRes.value.ok) {
      const data = await strategiesRes.value.json();
      if (data.ok && data.count !== undefined) {
        indicators.strategies.active = data.count;
      }
    } else {
      indicators.strategies._mock = true;
    }

    // Parse positions count
    if (positionsRes.status === "fulfilled" && positionsRes.value.ok) {
      const data = await positionsRes.value.json();
      if (data.ok && data.count !== undefined) {
        indicators.positions.open = data.count;
      }
    } else {
      indicators.positions._mock = true;
    }

    // Parse audit recent count (last 20 = "recent")
    if (auditRes.status === "fulfilled" && auditRes.value.ok) {
      const data = await auditRes.value.json();
      if (data.ok && data.data) {
        const now = Date.now();
        const recentThreshold = 30 * 60 * 1000; // 30 minutes
        indicators.audit.recent = data.data.filter((log: any) => {
          const logTime = new Date(log.timestamp).getTime();
          return now - logTime < recentThreshold;
        }).length;
      }
    } else {
      indicators.audit._mock = true;
    }

    return NextResponse.json(indicators, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({
      strategies: { active: 0, _mock: true },
      positions: { open: 0, _mock: true },
      audit: { recent: 0, _mock: true },
      _err: e?.message ?? "unknown-error",
    }, { status: 200 });
  }
}

