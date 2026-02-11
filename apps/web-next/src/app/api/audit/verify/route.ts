import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  try {
    const executorUrl = new URL(`${EXECUTOR_BASE}/v1/audit/verify`);
    executorUrl.searchParams.set("limit", limit.toString());

    const response = await fetch(executorUrl.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { ok: false, error: `Executor error: ${response.statusText}` },
      { status: response.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Executor unavailable: ${e?.message ?? "connection-failed"}` },
      { status: 500 }
    );
  }
}

