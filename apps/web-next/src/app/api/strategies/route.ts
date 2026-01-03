import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const limit = parseInt(searchParams.get("limit") || "6", 10);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const executorUrl = new URL(`${EXECUTOR_BASE}/v1/strategies`);
    if (status) executorUrl.searchParams.set("status", status);
    if (cursor) executorUrl.searchParams.set("cursor", cursor);
    executorUrl.searchParams.set("limit", limit.toString());

    const response = await fetch(executorUrl.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.data) {
          return NextResponse.json({
            strategies: data.data,
            count: data.count || data.data.length,
            limit: data.limit,
            hasMore: data.hasMore || false,
            nextCursor: data.nextCursor || null,
            _mock: false,
          }, { status: 200 });
        }
      }

    // Executor returned error, return empty array
    return NextResponse.json({
      strategies: [],
      count: 0,
      _err: `Executor error: ${response.statusText}`,
      _mock: true
    }, { status: 200 });
  } catch (e: any) {
    // Executor unreachable, return empty array
    return NextResponse.json({
      strategies: [],
      count: 0,
      _err: `Executor unavailable: ${e?.message ?? "connection-failed"}`,
      _mock: true
    }, { status: 200 });
  }
}

